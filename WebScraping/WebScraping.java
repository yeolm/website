
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.json.simple.JsonArray;
import org.json.simple.JsonObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.Select;

public class WebScraping {

	public static void main(String[] args) throws IOException, InterruptedException {
		/*
		 * 
		 * EXTRACTING DATA FROM CATALOG.METU.EDU.TR
		 * 
		 */
		long startTime = System.nanoTime();

		// connect to main page
		String target = "https://catalog.metu.edu.tr/";
		Document doc = Jsoup.connect(target).get();

		// take the links of academic units page and hold in a academicUnitList
		Elements academicUnitLinks = doc.getElementById("mcontent2").getElementsByTag("a");
		List<String> academicUnitList = new ArrayList<String>();
		// ignore Departments Reporting to President's Office and graduate programs
		int size = academicUnitLinks.size();
		for (int i = 1; i <= 5; i++) {
			academicUnitList.add(academicUnitLinks.eq(i).attr("href"));
		}
		for (int i = 11; i < size; i++) {
			if (i != 13) {
				academicUnitList.add(academicUnitLinks.eq(i).attr("href"));
			}
		}

		// use academicUnitLinks to reach facultyofDepartmentLinks
		List<String> facultyofDepartmentLinks = new ArrayList<>();

		for (String link : academicUnitList) {
			doc = Jsoup.connect(target + link).get();
			Elements beforeRead = doc.getElementsByClass("fac_inst").select("a");
			for (Element department : beforeRead) {
				facultyofDepartmentLinks.add(department.attr("href"));
			}

		}

		// create catalogmetu directory
		Path relatedPath = Paths.get(System.getProperty("user.dir") + File.separator + "catalogmetu");
		new File(relatedPath.toString()).mkdir();

		// preparation for deptCodesShortNames.json
		JsonObject deptCCN = new JsonObject();

		// preparation for mustCourses.json
		JsonObject mustCourses = new JsonObject();
		List<String >temp=new ArrayList<>();
		int departmentNumber = 0;
		for (String department : facultyofDepartmentLinks) {
			try {
				doc = Jsoup.connect(target + department).get();
				departmentNumber++;

				String deptCodeLink = doc.getElementById("depts_links").select("a").eq(1).attr("href");
				String deptCode = deptCodeLink.substring(deptCodeLink.length() - 3, deptCodeLink.length());
				temp.add(deptCode);
				// create dept object and put in mustCourses
				Elements allSemesters = doc.getElementsByTag("table");
				JsonObject dept = new JsonObject();
				addDeptCirriculum(allSemesters, dept);
				mustCourses.put(deptCode, dept);

				// put deptcode:deptShortName pair into deptCCN
				addDeptCodesShortNames(target + deptCodeLink, deptCode, deptCCN);

			} catch (NullPointerException e) {

				System.out.println(e);
			}

		}
		// write deptCodesShortNames.json
		BufferedWriter deptCNWriter = new BufferedWriter(
				new FileWriter(new File(relatedPath.toString() + File.separator + "deptCodesShortNames.json")));
		deptCNWriter.write(deptCCN.toJson());
		deptCNWriter.close();

		// write mustCourses.json
		BufferedWriter mustCoursesWriter = new BufferedWriter(
				new FileWriter(new File(relatedPath.toString() + File.separator + "mustCourses.json")));
		mustCoursesWriter.write(mustCourses.toJson());
		mustCoursesWriter.close();

		System.out.println("number of departments:" + departmentNumber);

		long endTime = System.nanoTime();
		System.out.println("Required time(s) to create deptCodesShortNames.json and mustCourses.json:"
				+ (endTime - startTime) / 1000000000);

		/*
		 * / EXTRACTING DATA FROM OIBS2.METU.EDU.TR
		 */
		long start_Time = System.nanoTime();
		Document oibs = Jsoup.connect("https://oibs2.metu.edu.tr/View_Program_Course_Details_64/").get();
		List<String> allDeptCodes = new ArrayList<>();
		//
		Elements elements = oibs.getElementsByTag("select").get(0).getElementsByTag("option");
		
		for (int i=1;i<elements.size();i++) {

			allDeptCodes.add(elements.get(i).getElementsByAttribute("value").val());
		}

		BufferedWriter allCoursesWriter = new BufferedWriter(
				new FileWriter(new File(relatedPath.toString() + File.separator + "allCourses.json")));
		at(allDeptCodes, allCoursesWriter);
		allCoursesWriter.close();
		long end_Time = System.nanoTime();
		System.out.println("Required time(s) to create allCourses.json"
				+ (end_Time - start_Time) / 1000000000);
	}

	private static void addDeptCodesShortNames(String url, String deptCode, JsonObject deptCCN) throws IOException {

		Document doc = Jsoup.connect(url).get();
		String deptShortNameLink = doc.getElementsByClass("short_course").select("a").first().text();

		int pointer = 0;
		for (char c : deptShortNameLink.toCharArray()) {
			if (Character.isLetter(c)) {
				pointer++;
			}
		}
		deptCCN.put(deptCode, deptShortNameLink.substring(0, pointer));

	}

	public static void addDeptCirriculum(Elements allSemesters, JsonObject dept) {
		int semesterNo = 0;
		boolean isElective = false;
		String text = "";

		for (Element semester : allSemesters) {
			JsonArray list = new JsonArray();
			semesterNo++;
			Elements rows = semester.select("tr");
			Iterator<Element> iterator = rows.iterator();
			while (iterator.hasNext() && !isElective) {
				Element row = iterator.next();
				text = row.selectFirst("td").text();
				if (text.contains("Any")) {
					isElective = true;
					continue;
				}
				try {
					String absoluteCode = row.selectFirst("[href]").toString().substring(45, 52);
					list.add(absoluteCode);

				} catch (NullPointerException ex) {
					System.out.println(ex);
				}
			}
			dept.put(String.valueOf(semesterNo), list);
			System.out.println("" + semesterNo + ":" + list);
			isElective = false;
		}
	}

	public static void at(List<String> allDeptList, BufferedWriter allCoursesWriter)
			throws InterruptedException, IOException {
		/*
		 * CHANGE Thread.sleep() somehow to when html is loaded
		 */
		// configuration
		System.setProperty("webdriver.chrome.driver", "C:\\Users\\yeolm\\Desktop\\chromedriver.exe");
		// create driver instance
		WebDriver driver = new ChromeDriver();
		// connect to mainpage
		driver.get("https://oibs2.metu.edu.tr/View_Program_Course_Details_64/");
		JsonArray allCourses = new JsonArray();
		for (String depts : allDeptList) {
			
			Select deptSelection = new Select(driver.findElement(By.name("select_dept")));
			Select semSelection = new Select(driver.findElement(By.name("select_semester")));
			deptSelection.selectByValue(depts);
			semSelection.selectByValue("20181");
			driver.findElement(By.name("submit_CourseList")).click();
			Thread.sleep(500);
			if(driver.findElement( By.id("formmessage")).getText().length()!= 0) {
				System.out.println("HEEEEEEEEEEEEEEEEEEEEEY");
					continue;
			}
			
			List<WebElement> courses = driver.findElements(By.name("text_course_code"));
			int courseNumber = courses.size();
			System.out.println("dsadsadasd" + courses.size());

			int i = 0;
			for (; i < courseNumber; i++) {
				driver.findElements(By.name("text_course_code")).get(i).click();
				driver.findElement(By.name("SubmitCourseInfo")).click();
				Thread.sleep(500);
				// read html
				allCourses.add(readCourseInfo(driver));

				// turn to previous page
				driver.findElement(By.name("SubmitBack")).click();
				Thread.sleep(500);

			}
			// turn to main page
			driver.findElement(By.name("SubmitBack")).click();
			Thread.sleep(500);

		}
		allCoursesWriter.write(allCourses.toJson());
		// Close the browser
		Thread.sleep(5);

		driver.quit();

	}

	private static JsonObject readCourseInfo(WebDriver driver) {
		// create course object
		JsonObject course = new JsonObject();

		// write cc and cn
		List<WebElement> tables = driver.findElements(By.tagName("table"));
		List<WebElement> courseInfo = tables.get(0).findElements(By.tagName("td"));
		String courseCode = courseInfo.get(2).getText();
		courseCode = courseCode.substring(courseCode.indexOf(":") + 1, courseCode.length());
		String courseName = courseInfo.get(3).getText();
		courseName = courseName.substring(courseName.indexOf(":") + 1, courseName.length() - 4);
		course.put("cc", courseCode);
		course.put("cn", courseName);

		JsonArray sectionArray = new JsonArray();
		// take instructorlists
		List<WebElement> instructorList = driver.findElements(By.tagName("table")).get(2)
				.findElements(By.tagName("tr"));

		// section iteration
		int pointer = 2;
		for (int tableNumber = 3; tableNumber < tables.size(); tableNumber++) {
			if (tables.get(tableNumber).findElements(By.tagName("tr")).size() == 1)
				break;

			JsonObject section = new JsonObject();

			// instructors
			JsonArray instructorArray = new JsonArray();
			section.put("sn",
					instructorList.get(pointer).findElements(By.tagName("input")).get(0).getAttribute("VALUE"));
			System.out.println(
					instructorList.get(pointer).findElements(By.tagName("input")).get(0).getAttribute("VALUE"));
			instructorArray.add(instructorList.get(pointer).findElements(By.tagName("td")).get(1).getText());
			instructorArray.add(instructorList.get(pointer).findElements(By.tagName("td")).get(2).getText());
			pointer = pointer + 7;
			section.put("inst", instructorArray);
			System.out.println(instructorArray);

			// sessions

			JsonArray sessionArray = new JsonArray();

			List<WebElement> sessionList = tables.get(tableNumber).findElements(By.tagName("tr"));

			for (WebElement ses : sessionList) {
				if (ses.findElements(By.tagName("td")).get(0).getText().length() == 0)
					break;
				JsonObject session = new JsonObject();
				List<WebElement> sesInfo = ses.findElements(By.tagName("td"));
				System.out.println(sesInfo.get(0).getText());
				session.put("d", sesInfo.get(0).getText());
				session.put("st", sesInfo.get(1).getText());
				session.put("end", sesInfo.get(2).getText());
				session.put("p", sesInfo.get(3).getText());

				sessionArray.add(session);
			}
			section.put("ses", sessionArray);
			sectionArray.add(section);
		}
		course.put("s", sectionArray);
		return course;
	}
}

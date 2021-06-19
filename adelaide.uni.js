const puppeteer = require('puppeteer');
const yargs = require("yargs");

const options = yargs
 .usage("Usage: -id <adeliade_id> -p <adelaide_password> -mfa <adelaide_mfa_token> -c <course_page> -m <module_page>")
 .option("s", { alias: "studentid", describe: "Your Adelaide Student Id", type: "string", demandOption: true })
 .option("p", { alias: "password", describe: "Your Adelaide Password", type: "string", demandOption: true })
 .option("t", { alias: "token", describe: "Your Okta MFA token", type: "string", demandOption: true })
 .option("c", { alias: "course", describe: "The course overview page", type: "string", demandOption: true })
 .option("m", { alias: "module", describe: "The first page of the first module (this is the position where PDFs will be generated from", type: "string", demandOption: true })
 .argv;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // login
  await page.goto(options.course, {
    waitUntil: 'networkidle2',
  });

  console.log("arrived on sign-in page");

  await page.focus('#okta-signin-username');
  await page.keyboard.type(options.studentid);
  await page.focus('#okta-signin-password');
  await page.keyboard.type(options.password);  
  await page.keyboard.press('Enter');

  console.log("Submitted credentials");

  // wait for MFA page to load
  await page.waitForNavigation();

  console.log("arrived on MFA page");

  // enter the MFA token
  await page.focus('input[type="tel"]');
  await page.keyboard.type(options.token);  
  await page.keyboard.press('Enter');

  // wait for course page to load
  await page.waitForNavigation();

  console.log("arrived on course overview page");
  
  // visit module 1 - page 1
  await page.goto(options.module, {
    waitUntil: 'networkidle2',
  });
  await print_page(page, 1);
  
  // repeat: click next, save to PDF until we don't have a Next button
  let doslimit = 150; // don't loop forever lest I have a bug and Adelaide block my account
  let pages_seen = 1;
  let page_number = 2;
  let module_number = 1;
  while (pages_seen <= doslimit) {
    let next = await page.$('.module-sequence-footer-button--next a');
    if (next == null) { /* we're done */ break; }
    
    // move to the next page in module notes
    next.click();

    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });

    let title = await page.$('h1.page-title');
    if (!title) continue;

    let page_title = await page.evaluate(el => el.innerText, title);
    if (!page_title.toLocaleLowerCase().startsWith("module")) continue; // skip this page, probably a quiz or assignment

    // Extract module number from "Module 1: Information risks"
    let title_parts = page_title.match(/Module (\d+)/);
    if (title_parts && title_parts.length === 2) {
      let current_module_number = parseInt(title_parts[1], 10);
      if (current_module_number !== module_number) { 
        console.log("New module. " + module_number + "->" + current_module_number);
        module_number = current_module_number;
        page_number = 1; // moved to a new module
      }
    } else {
      continue; // should be "Module <number>", skip it
    }

    await print_page(page, page_number++);
    pages_seen++;
  }

  await browser.close();
})();

async function print_page(page, page_number) {
  // grab the page title
  let filename = "Page " + page_number; // default PDF filename unless we can extract it from the pgae
  let title = await page.$('h1.page-title');
  if (!title) return new Promise(function(resolve) { resolve(); }); // no page title?
  
  // title should be in the form "Module <number>: Information"
  let page_title = await page.evaluate(el => el.innerText, title);
  let title_parts = page_title.match(/(Module \d+)/);
  if (title_parts && title_parts.length === 2) {
    let module = title_parts[1];
    // Add in the page number to the title: "Module <number> - Page 1: Information"
    filename = page_title.substring(0, module.length) + " - Page " + page_number + page_title.substring(module.length);
  } else {
    return new Promise(function(resolve) { resolve(); }); // skip this page, probably a quiz or assignment
  }

  filename = sanitize_filename(filename);
  console.log("filename=" + filename);

  return page.pdf({ path: filename + '.pdf', format: 'a4', landscape: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }});
}

function sanitize_filename(filename) {
  return filename.replace(":", " -").replace("/", " - ");
}
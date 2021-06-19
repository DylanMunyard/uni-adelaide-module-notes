# Canvas / Uni Adelaide Save Modules to PDF
Exports the module notes from the Uni of Adelaide Canvas portal. 

## Usage
```bash
Usage: -id <adeliade_id> -p <adelaide_password> -mfa <adelaide_mfa_token> -c
<course_page> -m <module_page>

Options:
      --help       Show help                                           [boolean]
      --version    Show version number                                 [boolean]
  -s, --studentid  Your Adelaide Student Id                  [string] [required]
  -p, --password   Your Adelaide Password                    [string] [required]
  -t, --token      Your Okta MFA token                       [string] [required]
  -c, --course     The course overview page                  [string] [required]
  -m, --module     The first page of the first module (this is the position
                   where PDFs will be generated from         [string] [required]
```

A successful login will print something like this on the console:
```bash
arrived on sign-in page
Submitted credentials
arrived on MFA page
arrived on course overview page
filename=Module 1 - Page 1 - Introduction
filename=Module 1 - Page 2 - Definitions and Key Concepts
filename=Module 1 - Page 3 - Threats and Vulnerabilities
```
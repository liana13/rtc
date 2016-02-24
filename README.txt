This is the README file of Vostan CMS developed by Instigate CJSC.

CONTENTS
    1. AUTHOR
    2. INTRODUCTION
    3. PREREQUISITES
    4. INSTALL
    5. USAGE
    6. LDAP INTEGRATION
    7. IMPORT FROM VOP
    8. DOCUMENTATION
    9. SOURCES

1. AUTHOR

Instigate CJSC
E-mail: info@instigatedesign.com
Tel: +1-408-454-6172
     +49-893-8157-1771
     +374-10-248411
Fax: +374-10-242919
URL: ggg.instigate.am


2. INTRODUCTION

Vostan CMS is a Free and Open Source Software for designing mindmap-based, touch screen friendly websites. Vostan CMS is based on Vostan Technologies and is available on Linux, Mac OSX and Windows.
Visit ggg.vostan.net for more information about Vostan.

3. PREREQUISITES

Vostan CMS is written on PHP and SQLite.
The following packages are the prerequisites for different platforms.

Linux
    - LAMP server
    - php5-ldap
    - php5-sqlite
To install the prerequisites on Ubuntu run the following command.
$sudo apt-get install lamp-server^ php5-ldap php5-sqlite
service apache2 restart

Mac OSX
MAMP server.
To download MAMP server visit www.mamp.info.

Windows
WAMP server.
To download WAMP server visit wampserver.com.

4. INSTALL

To install Vostan CMS download the package from ggg.vostan.net.
In order to deploy the Vostan CMS simple extract the downloaded file and copy the directory under root of the web server LAMP (MAMP, WAMP).

5. USAGE

To open Vostan CMS in the browser type in Address bar
"127.0.0.1/<vostan_website_name>/admin.php" where <vostan_website_name> is the name of the website you have specified.

Now you can edit your Vostan website! Please refer to ggg.vostan.net for more information on how to edit Vostan websites.

To change the title of the website appeared on the browser tab edit the Title variable in config.php file in the top level directory of Vostan CMS package.

6. LDAP INTEGRATION
Vostan CMS has buil-in support of LDAP integration.
To enable LDAP authentication do the following changes in config.php file in the top level directory of Vostan CMS package:
    - change the value of localuserenabled variable to false
    - edit the values of the following variables in config.php according to the setup of your LDAP server:
    - ldapServer = 'ldap://192.0.0.0';
    - ldapPort = 389;

    - ldapBase = 'dc=vostan,dc=net';
    - ldapBaseOU = 'ou=people,dc=vostan,dc=net';
    - ldapBaseGR = 'cn=guest,ou=group,dc=vostan,dc=net';

7. IMPORT FROM VOP

You can import an existing Vostan Office Project (vop) as a Votan CMS website.

Linux and Mac OSX
Navigate to the top level directory of Vostan CMS package and run the following bash script:
$ ./import_from_vop.sh <vop_file>

Windows
Coming soon.

8. DOCUMENTATION

Please refer to ggg.vostan.net for more information about Vostan Technologies.

9. SOURCES

Vostan CMS is a Free and Open Source Software.
Please refer to ggg.vostan.net for more information about Vostan CMS source code.


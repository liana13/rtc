<?php
/*
 * Vostan CMS
 * Copyright (c) 2005-2015 Instigate CJSC
 * E-mail: info@instigatedesign.com
 * 58/1 Karapet Ulnetsi St.,
 * Yerevan, 0069, Armenia
 * Tel:  +1-408-625-7509
 * +49-893-8157-1771
 * +374-60-464700
 * +374-10-248411

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

    ob_start();
?>
<!DOCTYPE html>
<html class="no-js">
    <script>
        function setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toGMTString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        }

        var hash = document.location.hash.substring(1);
        if (!hash) {
            setCookie("v_root", "", 365);
        } else if (hash != "login") {
            setCookie("v_root", hash, 365);
        }
    </script>
<?php
    require_once('config.php');
    require_once('header.php');
    if ($localuserenabled == true) {
        $_SESSION['user'] = $localuser;
        $_SESSION['cn'] = $localusername;
    } else {
        include 'vostan_auth/auth.php';
    }
?>
    <head>
        <META NAME="ROBOTS" CONTENT="INDEX, NOFOLLOW">
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <title><?= $title?></title>
        <link rel="shortcut icon" href="favicon.ico" />
        <link rel="stylesheet" href="vendor/jquery/css/jquery-ui-1.10.3.custom.min.css" media="screen">
        <link rel="stylesheet" href="vostan_lib/vostan.css">
        <link rel="stylesheet" href="vendor/cm/cm.css">
        <script src="vendor/jquery/js/jquery-1.10.1.min.js"></script>
        <script src="vendor/kjs/kinetic-v5.1.0.min.js"></script>
        <script src="vendor/jquery/js/jquery-ui-1.10.3.custom.min.js"></script>
        <script src="vendor/jquery/js/jquery.ui.touch-punch.js"></script>
        <script src="vendor/tinymce/js/tinymce/tinymce.min.js"></script>
        <script src="vendor/tag-it.min.js"></script>
        <script src="vendor/cm/cm.js"></script>
        <script src="vostan_lib/vostan.rtc.js"></script>
    </head>
    <body>
        <script src="vostan_lib/vostan.js"></script>
        <script src="vostan_lib/vostan_admin.js"></script>
    </body>
</html>

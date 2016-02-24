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


if ($_POST) {
    require_once('ldap_bind.php');
    require_once('../header.php');
    $ldap['user'] = "uid=" . $_POST['user'] . ",".$ldapBaseOU;
    $ldap['pass'] = $_POST['pass'];
    $ldap['host'] = $ldapServer;
    $ldap['port'] = $ldapPort;
    $ldap['conn'] = ldap_connect($ldap['host'], $ldap['port']) or die("Could not conenct to {$ldap['host']}");

    ldap_set_option($ldap['conn'], LDAP_OPT_PROTOCOL_VERSION, 3);
    $ldap['bind'] = ldap_bind($ldap['conn'], $ldap['user'], $ldap['pass']);

    $loginFailed = false;
    if ($ldap['bind']) {
        $user = $_POST['user'];
        $filter = "(uid=" . $user . ")";
        $justthese = array('cn', 'uid', 'givenname');
        $ldapSearch = ldap_search($ldap['conn'], $ldapBase, $filter, $justthese);
        $ldapResults = ldap_get_entries($ldap['conn'], $ldapSearch);
        $cn = $ldapResults[0]['cn'][0];

        //check membership
        $ldapBase = $ldapBaseGR;
        $filter = "(memberuid=" . $user . ")";
        $justthese = array('memberuid', 'uid');
        $ldapSearch = ldap_search($ldap['conn'], $ldapBase, $filter, $justthese);
        $ldapResults = ldap_get_entries($ldap['conn'], $ldapSearch);
        if ($ldapResults['count'] != 0) {
            $_SESSION['user'] = $user;
            $_SESSION['cn'] = $cn;
            $url = $_SERVER['HTTP_REFERER'];

            header('Location: ' . $url . '#login');
            exit();
        } else {
            $loginFailed = true;
        }
    } else {
        $loginFailed = true;
    }
    if ($loginFailed) {
        $auth_msg = "Invalid username and/or password.";
        $_SESSION['msg'] = $auth_msg;
        $url = $_SERVER['HTTP_REFERER'];
        header('Location: ' . $url . '#login');
        exit();
    }

    echo "</p><br />";

    ldap_close($ldap['conn']);

} else {
    require_once('header.php');
    include "login_view.php";
}

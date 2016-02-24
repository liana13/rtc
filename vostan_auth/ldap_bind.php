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

    include '../config.php';

    // try to connect to the server
    $ldapConn = ldap_connect($ldapServer, $ldapPort);
    if (!$ldapConn) {
        die('Cannot Connect to LDAP server');
    }
    ldap_set_option($ldapConn, LDAP_OPT_PROTOCOL_VERSION, 3);
    // bind
    $ldapBind = ldap_bind($ldapConn);
    if (!$ldapBind) {
        die('Cannot Bind to LDAP server');
    }

?>

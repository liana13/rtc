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

<html class="no-js">
    <head>
        <title>Vostan Login</title>
        <META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW">
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <link rel="stylesheet" href="vostan_lib/vostan.css?v=1">
        <style>
            #vostanApp input[type="text"].login, #vostanApp input[type="password"] {
                border: 1px solid #999999;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2) inset;
                font-family: inherit;
                font-size: 13px;
                line-height: 1.4em;
                outline: medium none;
                padding: 2px;
                width: 150px;
            }
            .msg p {
                color: red;
                font-size: 11px;
                height: 15px;
            }
            node div.cell {
                margin-bottom: 5px;
            }
        </style>
    </head>
    <body>
        <div id="viewTab">
            <div id="vostanContainer">
                <div id="vostanApp" class="presentation">
                    <section>
                        <div id="vostanMap">
                            <node style="top: 201px; left: 285px; width: 300px; height: 230px; position: absolute;" class="node-t">
                                <div style="margin:20px;">
                                    <h3>Login with LDAP user</h3>
                                    <form method="POST" action="vostan_auth/login.php" autocomplete="off">
                                        <p>
                                            <?php
                                            if (isset($_SESSION['msg'])) {
                                                echo $_SESSION['msg'];
                                                unset($_SESSION['msg']);
                                            }
                                            ?>
                                        </p>
                                        <div class="cell title">
                                            User Name:
                                        </div>
                                        <div class="cell value">
                                            <input id="v_uname" type="text" name="user" class="login" autofocus required />
                                        </div>
                                        <div class="cell title">
                                            Password:
                                        </div>
                                        <div class="cell value">
                                            <input id="v_passwd" type="password" name="pass" required />
                                        </div>
                                        <div class="cell button">
                                            <input id="v_login" type="submit" name="submit" value="Submit">
                                        </div>
                                    </form>
                                </div>
                            </node>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </body>
</html>

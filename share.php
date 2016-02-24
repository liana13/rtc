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
session_start();

/* SQL Connection Helper Functions */
function getConnection() {
	$dbh = new PDO('sqlite:vostan.db');
	$dbh -> setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $dbh;
}

function getLocation($nid) {
    $protocol = (isset($_SERVER['HTTPS']) &&
                ($_SERVER['HTTPS'] == 'on' || $_SERVER['HTTPS'] == 1) || 
                isset($_SERVER['HTTP_X_FORWARDED_PROTO']) &&
                $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https') ? 'https://' : 'http://';
    $sub_dir = str_replace('share.php', "", $_SERVER['PHP_SELF']);
    $location = $protocol . $_SERVER['HTTP_HOST'] . $sub_dir . "#" . $nid;
    return $location;
}

function redirect($nid, $lang) {
    header("Location: " . getLocation($nid), true, 301);
    die();
}

function shareNodeContent($nid, $lang) {
    $lang = ($lang == "en") ? "" : "_$lang";
    $db = getConnection();
    $sql = "SELECT 
        n.nodeID AS 'nodeID', 
        n.title$lang AS 'title',
        n.txt$lang AS 'txt',
        n.img AS 'img'
        FROM 
        nodes n   
        WHERE n.nodeID = :nid AND n.viewers LIKE '%'||'all'||'%'";
    $stmt = $db -> prepare($sql);
    $stmt -> bindParam("nid", $nid);
    $stmt -> execute();
    $node = $stmt -> fetchAll(PDO::FETCH_OBJ);  
    $db = null;
    if(!empty($node)) {
?>
        <html>
            <head>
                <meta http-equiv="content-type" content="text/html; charset=utf-8">
                <title><?php echo $node[0] -> title ?></title>
                <meta property="og:description" content="<?php echo strip_tags($node[0] -> txt) ?>"/>
                <meta property="og:image" content="<?php echo $node[0] -> img ?>"/>
            </head>
            <body></body>
        </html>
<?php
    }
}

function shareNode($nid, $lang) {
    try {
        if (isset($_SERVER['HTTP_REFERER'])) {
            redirect($nid, $lang);
        } else {
            shareNodeContent($nid, $lang);
        }
    } catch(PDOException $e) {
        echo getLocation($nid);
    }
}

shareNode($_GET['id'], $_GET['lang']);

/* END API Handlers */
?>

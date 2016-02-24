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
require_once('header.php');

if (!isset($basedir)) {
    $basedir = "";
}

function getBaseDir() {
    global $basedir;
    return $basedir;
}

require getBaseDir().'vendor/Slim/Slim.php';
\Slim\Slim::registerAutoloader();

/* SQL Connection Helper Functions */
function getConnection() {
    $dbh = new PDO('sqlite:vostan.db');

    $dbh -> setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $dbh;
}

function checkSession() {
    if (!isset($_SESSION['user'])) {
        echoResponse('{"error":"logout"}');
        exit();
    }
}

/* Get default language */
function getDefaultLang() {
    if (isset($_COOKIE['def_lang'])) {
    $def_lang = $_COOKIE['def_lang'];
    return ($def_lang == '' || $def_lang == 'en' ? '' : '_' . $def_lang);
    } else {
        return '';
    }
}

/* SQL Connection Helper Functions */

$app = new \Slim\Slim();

// GET route
$app -> get('/', function() {
    echo "MMIAPI";
});

//GetMap by ID
$app -> get('/map/root/:rid/lang/:lang', 'getMap');
//GetMap by ID
$app -> get('/rels/root/:rid/lang/:lang', 'getRelations');
//GetNode by ID
$app -> get('/node/:rid', 'getNode');
//GetLink by IDs
$app -> get('/link/:id1/:id2/lang/:lang', 'getLink');
//Export presentation
$app -> post('/export/root/:rid/lang/:lang', 'exportPresentation');
//Export vop file
$app -> post('/export/vop/root/:rid/lang/:lang', 'exportSQLDatabase');
//Export vop file
$app -> get('/export/all/vop/root/:rid/lang/:lang', 'exportAllSQLDatabase');
//Export All presentation
$app -> get('/export/all/root/:rid/lang/:lang', 'exportAllPresentation');
//appendNode for the root ID
$app -> post('/append/node/:nid/root/:rid', 'appendNode');
//expandNode for the root ID
$app -> get('/expand/node/:nid/root/:rid/lang/:lang', 'expandNode');
//copySettings for the node ID
$app -> get('/copysettings/node/:nid/root/:rid', 'copySettings');

//addNode for the root ID
$app -> post('/add/node/lang/:lang', 'addSimpleNode');
//addNode for the root ID
$app -> post('/add/node/:nid/root/:rid/lang/:lang', 'addNode');
//addLink for the root ID

$app -> post('/add/link/root/:rid/lang/:lang', 'addLink');
//updateNode for the root ID
$app -> post('/update/node/:nid/root/:rid/lang/:lang', 'updateNode');
//updateLink
$app -> post('/update/link/root/:rid/lang/:lang', 'updateLink');
//deleteNode for the root ID
$app -> get('/hide/node/:nid/root/:rid', 'hideNode');
//deleteLink for the root ID
$app -> post('/delete/link/root/:rid', 'deleteLink');
//appendNodeToAll for the root ID
$app -> get('/appendtoall/node/:nid/root/:rid', 'appendNodeToAll');
//deleteNodeFromAll for the root ID
$app -> get('/hidefromall/node/:nid/root/:rid', 'hideNodeFromAll');
//Get All Nodes
$app -> get('/nodes/search/:text/lang/:lang', 'getAllNodes');
//Upload Image
$app -> post('/upload', 'handleUpload');
//Upload Image from URL
$app -> post('/upload/url', 'handleUploadFromURL');
//Get All Uploaded Images
$app -> get('/uploads', 'handleListImages');
//Upload Images
$app -> post('/attach', 'handleAttach');
//GetAll Tags
$app -> get('/tags/lang/:lang', 'getAllNodeTags');

$app -> get('/tags/links/lang/:lang', 'getAllLinkTags');

//get all users
$app -> get('/users', 'getAllNodeUsers');

//Check whether user can edit selected node
$app -> get('/check/user/type/node/:nid', 'checkIsUserEditor');

$app -> post('/query/lang/:lang/root/:rid', 'getQuery');
//Check which node must be root
$app -> get('/check/root', 'checkUser');
$app -> get('/delete/node/:nid', 'deleteNode');
$app -> get('/delete/full/node/:nid', 'deleteNodeFull');
$app -> get('/download/node/:nid', 'downloadNode');
//Copy node from one layer to another
$app -> get('/paste/node/:nid/from/:root/to/:rid', 'pasteNode');

$app -> run();

/* API Handlers */
function getUserID() {
    $username = $_SESSION["user"];
    $id = 0;
    
    $db = getConnection();
    $sql2 = "SELECT nodeID FROM nodes WHERE title = :uid;";
    $stmt = $db -> prepare($sql2);
    $stmt -> bindParam("uid", $username);
    $stmt -> execute();
    $rid_arr = $stmt -> fetchAll(PDO::FETCH_NUM);
    if (sizeOf($rid_arr) > 0) {
        $rid = $rid_arr[0];
        $id = $rid[0];
    }
    
    $db = null;
    return $id;
}

function checkUser() {
    try {
        $username = $_SESSION["user"];
        $id = getUserID();
        
        $db = getConnection();

        if (!$id) {
            $sql1 = "SELECT max(nodeID) FROM nodes;";
            $stmt = $db -> prepare($sql1);
            $stmt -> execute();
            $max_id_db = $stmt -> fetch(PDO::FETCH_NUM);
            $max_id_db = $max_id_db[0];
            $max_id = $max_id_db + 1;
            $id = $max_id;
            $sql2 = "INSERT INTO nodes (nodeID, title, modified, script, tags, users, viewers)
                VALUES ($max_id, '$username', date(), '', 'user', '$username', '');";
            $stmt = $db -> prepare($sql2);
            $stmt -> execute();

            $sql3 = "Insert into settings (nodeID, linkedNodeID, top, left, titleHeight, titleLeft, titleTop, modified)
                VALUES ($max_id, $max_id, 300, 300, 40, 25, 35, date());";
            $stmt = $db -> prepare($sql3);
            $stmt -> execute();

        }
        $db = null;
        echoResponse('{"root":' . $id . '}');
    } catch(PDOException $e) {
        return '{"error":{"checkUser":"' . $e -> getMessage() . '"}}';
    }
}

function getNode($rid) {
    try {
        $db = getConnection();

        $user_condition = "";
        $username = getSessionUser();
        $everyone = "all";
        if (!isAdminUser()) {
            $user_condition = " AND (n.users LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$everyone'||'%')";
        }

        $sql1 = "SELECT 
            n.nodeID AS 'nodeID', 
            n.title AS 'title',
            n.img AS 'img',
            n.txt AS 'txt',
            n.script AS 'script',
            n.tags AS 'tags',
            n.location AS 'location'
            FROM 
            nodes n    
            WHERE n.nodeID = :rid". $user_condition;
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("rid", $rid);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);
        $ret_node = $node[0];

        $db = null;

        echoResponse(json_encode($ret_node));
    } catch(PDOException $e) {
        echoResponse('{"error":{"getNode":"' . $e -> getMessage() . '"}}');
    }
}

function getLink($nid1, $nid2, $lang) {
    try {
        $db = getConnection();
        $lang = ($lang == "en") ? "" : "_$lang";

        $sql1 = "SELECT 
            l.nodeID AS 'nodeID', 
            l.linkedNodeID AS 'linkedNodeID',
            l.tags$lang AS 'tags'
            FROM 
            links l
            WHERE l.nodeID = :nid1 AND l.linkedNodeID = :nid2";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("nid1", $nid1);
        $stmt -> bindParam("nid2", $nid2);
        $stmt -> execute();
        $link = $stmt -> fetchAll(PDO::FETCH_OBJ);
        $db = null;

        if(sizeOf($link) == 0){
            echoResponse('{"error":{"getLink":"Link does not exist"}}');
        } else {
            $ret_link = $link[0];
        echoResponse(json_encode($ret_link));
        }
    } catch(PDOException $e) {
        echoResponse('{"error":{"getLink":"' . $e -> getMessage() . '"}}');
    }
}
function getMap($rid, $lang) {
    echoResponse(getMapData($rid, $lang, false));
}

function getRelations($rid, $lang) {
  echoResponse(getRelationData($rid, $lang));
}

function isUserSet() {
    return ($_SESSION && isset($_SESSION['user'])) == true;
}

function getSessionUser() {
    $username = ($_SESSION && isset($_SESSION['user'])) ? $_SESSION["user"] : "all";
    return $username;
}

function getUserCondition() {
    $user_condition = "";
    $username = getSessionUser();
    $everyone = "all";
    if (!isAdminUser()) {
        $user_condition = " AND (nodes.users LIKE '%'||'$username'||'%' OR nodes.viewers LIKE '%'||'$username'||'%' OR nodes.viewers LIKE '%'||'$everyone'||'%')";
    }
    return $user_condition;
}

function getUserQueryCondition() {
    $user_condition = "";
    $username = getSessionUser();
    $everyone = "all";
    if (!isAdminUser()) {
        $user_condition = " (n.users LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$everyone'||'%')";
    }
    return $user_condition;
}

function isAdminUser() {
    return isUserSet();
}

function getMapData($rid, $lang, $isExport) {
    try {
        $db = getConnection();
        $user_condition = "";
        $username = getSessionUser();
        $everyone = "all";
        if (!isAdminUser()) {
            $user_condition = " AND (n.users LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$everyone'||'%')";
        }

        $langValue = ($lang == "en") ? "" : "_$lang";

        $defLang = getDefaultLang();
        $sql1 = "SELECT 
                s.linkedNodeID AS 'nodeID', 
                n.title$defLang AS defaultTitle,
                n.title$langValue AS 'title',
                n.img AS 'img',
                n.txt$defLang AS defaultTxt,
                n.txt$langValue AS 'txt',
                n.script AS 'script',
                n.tags$defLang AS 'defaultTags',
                n.tags$langValue AS 'tags',
                n.users AS 'users',
                n.viewers AS 'viewers',
                n.location AS 'location',
                s.top AS 'top',
                s.left AS 'left',
                s.width AS 'width',
                s.height AS 'height',
                s.imgWidth AS 'imgWidth',
                s.imgHeight AS 'imgHeight',
                s.imgLeft AS 'imgLeft',
                s.imgTop AS 'imgTop',
                s.titleWidth AS 'titleWidth',
                s.titleHeight AS 'titleHeight',
                s.titleLeft AS 'titleLeft',
                s.titleTop AS 'titleTop',
                s.txtWidth AS 'txtWidth',
                s.txtHeight AS 'txtHeight',
                s.txtLeft AS 'txtLeft',
                s.txtTop AS 'txtTop',
                s.titleInclude AS 'titleInclude',
                s.imgInclude AS 'imgInclude',
                s.txtInclude AS 'txtInclude',
                s.leaf AS 'leaf',
                s.carousel AS 'carousel'
                FROM 
                settings s INNER JOIN nodes n ON s.linkedNodeID = n.nodeID   
                WHERE s.nodeID = :rid" . $user_condition;
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("rid", $rid);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);  
        $rootuser = "";

        foreach ($node as $key => $value) {
            //Set Default User Permission   
            $value -> user = "";
            if ($isExport) {
                $tags = explode(',', $value->tags); 
                if (1 == $value->imgInclude && "" != $value -> img) {
                    $source = $value -> img;
                    $dest = 'export/' . $value -> img;
                    shell_exec("cp $source $dest");
                } else {
                    $value -> img = "";
                }
                $value -> txt = $value -> txtInclude == 0 ? "" : $value -> txt;
                if (false !== strpos($value -> tags, 'vostan::query')) {
                    $value->nodes = getQueryHelper($value -> tags, $lang, $rid);
                }
            } else if (isUserSet()) {
                if (isAdminUser()) {
                    $value -> user = "editor"; 
                    $rootuser = "editor";
                } else {
                    if (mb_strpos($value -> users, $username) !== false) {
                        $value -> user = "editor";
                    } else if (mb_strpos($value -> viewers, $username) !== false || mb_strpos($value -> viewers, "all") !== false) {
                        $value -> user = "viewer";
                    }
                    if ($rid == $value -> nodeID) {                     
                        $rootuser = $value -> user;
                    }
                }                   
            } else {
                if ($rid == $value -> nodeID && mb_strpos($value -> viewers, "all") !== false) {                        
                    $rootuser = "viewer";
                }
            }
        }               

        $sql2 = "SELECT
                 l.nodeID AS 'nodeID', 
                 l.linkedNodeID AS 'linkedNodeID',
                 l.tags$langValue AS 'linkTags',
                 l.tags$defLang AS 'defaultLinkTags'
                 from 
                 links l 
                 INNER JOIN settings s ON s.linkedNodeID = l.nodeID 
                 WHERE s.nodeID = :rid AND l.linkedNodeID IN 
                 (SELECT st.linkedNodeID FROM settings AS st WHERE st.nodeID = :rid); ";
        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("rid", $rid);
        $stmt -> execute();
        $links = $stmt -> fetchAll(PDO::FETCH_OBJ);

        $db = null;
        
        if (!$isExport && $rootuser == "") {
            $node = array();
            $links = array();
        }

        return '{"root":' . $rid . ',"nodes":' . json_encode($node) . ',"links":' . json_encode($links) . ',"rootuser":"' . $rootuser . '"}';
    } catch(PDOException $e) {
        return '{"error":{"getMapData":"' . $e -> getMessage() . '"}}';
    }
}

function getRelationData($rid, $lang) {
  try {
    $db = getConnection();
    $user_condition = "";
    $username = getSessionUser();
    $everyone = "all";
    if (!isAdminUser()) {
      $user_condition = " AND (n.users LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$username'||'%' OR n.viewers LIKE '%'||'$everyone'||'%')";
    }

    $lang = ($lang == "en") ? "" : "_$lang";

    $defLang = getDefaultLang();
    $sql1 = "SELECT DISTINCT
                n.nodeID AS 'nodeID', 
                n.title$defLang AS defaultTitle,
                n.title$lang AS 'title',
                n.img AS 'img',
                n.txt$defLang AS defaultTxt,
                n.txt$lang AS 'txt',
                n.script AS 'script',
                n.tags$defLang AS 'defaultTags',
                n.tags$lang AS 'tags',
                n.users AS 'users',
                n.viewers AS 'viewers',
                n.location AS 'location'
                FROM 
                    links l INNER JOIN nodes n ON (l.linkedNodeID = n.nodeID OR l.nodeID = n.nodeID)
                WHERE l.linkedNodeID = :rid OR l.nodeID = :rid" . $user_condition;    

    $stmt = $db -> prepare($sql1);
    $stmt -> bindParam("rid", $rid);
    $stmt -> execute();
    $node = $stmt -> fetchAll(PDO::FETCH_OBJ);  
    $rootuser = ""; 

    $sql2 = "SELECT
                 l.nodeID AS 'nodeID', 
                 l.linkedNodeID AS 'linkedNodeID',
                 l.tags$lang AS 'linkTags'
                 from links l WHERE l.nodeID = :rid OR l.linkedNodeID = :rid; ";
    $stmt = $db -> prepare($sql2);
    $stmt -> bindParam("rid", $rid);
    $stmt -> execute();
    $links = $stmt -> fetchAll(PDO::FETCH_OBJ);

    $db = null;

    return '{"root":' . $rid . ',"nodes":' . json_encode($node) . ',"links":' . json_encode($links) . ',"rootuser":"' . $rootuser . '"}';
  } catch(PDOException $e) {
    return '{"error":{"getRelations":"' . $e -> getMessage() . '"}}';
  }
}

function createExportAttachment($tmp_dir, $rid, $ext) {
    $date = date('Y-m-d', time());
    $time = date('H-i-s', time());
    $dirname = "vostan_export_" . $date . "_" . $time;
    $zipname = "$dirname.$ext";
    $zipdest = "assets/attachments/";
    $dir = "vop" == $ext ? "tmp_vostan" : $dirname;
    $ziplocation = $zipdest . $zipname;
    if (!is_dir($zipdest)) {
        mkdir($zipdest, 0777);
    }   
    $zip = "vop" == $ext ? "tar zcf " : "zip -r"; 
    shell_exec("mv -f $tmp_dir $dir");
    shell_exec("$zip $zipname $dir");
    shell_exec("mv $zipname $ziplocation"); 
    shell_exec("rm -r $dir");   
    try {
        $db = getConnection();

        $sql1 = "SELECT max(nodeID) FROM nodes;";
        $stmt = $db -> prepare($sql1);
        $stmt -> execute();
        $max_id_db = $stmt -> fetch(PDO::FETCH_NUM);
        $max_id_db = $max_id_db[0];
        $max_id = $max_id_db + 1;

        $username = getSessionUser();
        $sql2 = "";
        $lang = "";
        $tags = "attachment";
        $sql2 = "INSERT INTO nodes (nodeID, title, img, modified, tags, users) 
                        VALUES ($max_id, :title, :img, date(), :tags, :users)";

        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("title", $zipname);
        $stmt -> bindParam("img", $ziplocation);
        $stmt -> bindParam("tags", $tags);
        $stmt -> bindParam("users", $username);
        $stmt -> execute();

        $sql3 = "INSERT INTO settings 
                    (nodeID, linkedNodeID, top, left, titleHeight, modified)
                    VALUES  ($max_id, $max_id, 300, 300, 40, date());";
        $stmt = $db -> prepare($sql3);
        $stmt -> execute();

        $sql4 = "INSERT INTO settings 
                    (nodeID, linkedNodeID, top, left, titleHeight, modified)
                    VALUES ($max_id, $rid, 60, 60, 40, date());";
        $stmt = $db -> prepare($sql4);
        $stmt -> execute(); 

        $sql4 = "INSERT INTO links (nodeID, linkedNodeID, tags, modified)
                    VALUES (:nid, :lnid, '', date());";
        $stmt = $db -> prepare($sql4);
        $stmt -> bindParam("nid", $max_id);
        $stmt -> bindParam("lnid", $rid);
        $stmt -> execute();         

        $userid = getUserID();
        if ($userid) {
            $sql5 = "INSERT INTO settings 
                        (nodeID, linkedNodeID, top, left, titleHeight, modified)
                        VALUES ($max_id, $userid, 60, 400, 40, date());";
            $stmt = $db -> prepare($sql5);
            $stmt -> execute(); 

            $sql5 = "INSERT INTO links (nodeID, linkedNodeID, tags, modified)
                        VALUES (:nid, :lnid, '', date());";
            $stmt = $db -> prepare($sql5);
            $stmt -> bindParam("nid", $max_id);
            $stmt -> bindParam("lnid", $userid);
            $stmt -> execute(); 
        }
        return '{"root":' . $rid . ', "id":'. $max_id . 
                                   ', "name":"' . $zipname . '"}';
    } catch(PDOException $e) {
        shell_exec("rm $ziplocation"); 
        return '{"error":{"exports":"' . $e -> getMessage() . '"}}';
    }
}

function createTables($db) {
    // Create `nodes` table
    $sql1 = "CREATE TABLE nodes ( 
        nodeID int(11) NOT NULL PRIMARY KEY, 
        title longtext CHARACTER NOT NULL, 
        img longtext CHARACTER, 
        txt longtext CHARACTER,
        isDefaultRoot int(11) NOT NULL DEFAULT 0,
        modified timestamp NULL DEFAULT NULL, 
        script TEXT,
        tags TEXT DEFAULT '', 
        carousel INTEGER DEFAULT 0,
        users TEXT  DEFAULT '' NOT NULL, 
        viewers TEXT  DEFAULT '' NOT NULL,
        title_hy TEXT  DEFAULT '',
        title_ru TEXT  DEFAULT '',
        txt_hy TEXT  DEFAULT '',
        txt_ru TEXT  DEFAULT '',
        tags_hy TEXT  DEFAULT '',
        tags_ru TEXT  DEFAULT '',
        location TEXT)";
    $stmt = $db -> prepare($sql1);
    $stmt -> execute();

    // Create `links` table
    $sql2 = "CREATE TABLE links (
        nodeID int(11) NOT NULL,
        linkedNodeID int(11) NOT NULL,
        modified timestamp NULL DEFAULT NULL, 
        tags TEXT,
        tags_hy TEXT  DEFAULT '',
        tags_ru TEXT  DEFAULT '',
        PRIMARY KEY (nodeID, linkedNodeID))";
    $stmt = $db -> prepare($sql2);
    $stmt -> execute();
    
    // Create `settings` table
    $sql3 = "CREATE TABLE settings (
        nodeID int (11) NOT NULL, linkedNodeID int (11) NOT NULL,
        radius int (11) NOT NULL DEFAULT(1),
        top double NOT NULL DEFAULT '10', 
        left double NOT NULL DEFAULT '10',
        width double NOT NULL DEFAULT '250',
        height double NOT NULL DEFAULT '100', 
        imgWidth double NOT NULL DEFAULT '40',
        imgHeight double NOT NULL DEFAULT '40',
        imgLeft double NOT NULL DEFAULT '10',
        imgTop double NOT NULL DEFAULT '10',
        titleWidth double NOT NULL DEFAULT '220', 
        titleHeight double NOT NULL DEFAULT '70',
        titleLeft double NOT NULL DEFAULT '15', 
        titleTop double NOT NULL DEFAULT '15',
        txtWidth double NOT NULL DEFAULT '230', 
        txtHeight double NOT NULL DEFAULT '40',
        txtLeft double NOT NULL DEFAULT '10',
        txtTop double NOT NULL DEFAULT '50',
        imgInclude int (11) DEFAULT '0', 
        titleInclude int (11) DEFAULT '1', 
        txtInclude int (11) DEFAULT '0',
        modified timestamp DEFAULT 'NULL', 
        leaf INTEGER DEFAULT 0, 
        carousel INTEGER DEFAULT 0, 
        PRIMARY KEY (nodeID, linkedNodeID, radius))";
    $stmt = $db -> prepare($sql3);
    $stmt -> execute();
}

function insertIntoNodesTable($db, $ids) {
    $str = implode(',', $ids);
    $sql = "SELECT * FROM nodes n WHERE n.nodeID IN ($str)";
    $nodes = getRows($sql);
    insertRows($db, $nodes, 'nodes', array());
    return $nodes;
}

function insertIntoSettingsTable($db, $nodesID, $exportDir) {
    $str = implode(',', $nodesID);
    $sql = "SELECT * FROM settings s WHERE s.nodeID IN ($str)";
    $settings = getRows($sql);
    insertRows($db, $settings, 'settings', $nodesID);
    $assetsInfo = array();
    for($i = 0; $i < count($settings); $i++) {
        $sett = $settings[$i];
        if(empty($assetsInfo[$sett->linkedNodeID]) || 
                1 != $assetsInfo[$sett->linkedNodeID]) {
            $assetsInfo[$sett->linkedNodeID] = $sett->imgInclude;
        }
    }
    insertLeafSettings($db, array_keys($assetsInfo));
    $nodes = insertIntoNodesTable($db, array_keys($assetsInfo));
    copy_assets($nodes, $assetsInfo, $nodesID, $exportDir);
}

function insertLeafSettings($db, $ids) {
    $str = implode(',', $ids);
    $sql = "SELECT * FROM settings s 
        WHERE s.nodeID = s.linkedNodeID AND s.linkedNodeID IN ($str)";
    $settings = getRows($sql);
    insertRows($db, $settings, 'settings', array());
}

function copy_assets($nodes, $assetsInfo, $nodesID, $dir) {
    for($i = 0; $i < count($nodes); $i++) {
        $tags = explode(',', $nodes[$i]->tags); 
        if(((in_array('attachment', $tags) && 
            in_array($nodes[$i]->nodeID, $nodesID)) || 
               1 == $assetsInfo[$nodes[$i]->nodeID]) && "" != $nodes[$i]->img) {
            shell_exec("cp " .$nodes[$i]->img. " " .$dir. "/" .$nodes[$i]->img);
        }
    }
}

function getRows($sql) {
    $db = getConnection();
    $user_condition = getUserCondition();
    $stmt = $db -> prepare("$sql $user_condition");
    $stmt -> execute();
    $rows = $stmt -> fetchAll(PDO::FETCH_OBJ);
    return $rows;
}

function insertIntoLinksTable($db, $ids) {
    $str = implode(',', $ids);
    $sql = "SELECT distinct l.nodeID AS 'nodeID', 
        l.linkedNodeID AS 'linkedNodeID', 
        l.modified AS 'modified', 
        l.tags AS 'tags',
        l.tags_hy AS 'tags_hy',
        l.tags_ru AS 'tags_ru' 
        FROM links l INNER JOIN settings s ON s.linkedNodeID = l.nodeID 
        WHERE (s.nodeID IN ($str) AND l.linkedNodeID IN 
        (SELECT st.linkedNodeID FROM settings AS st WHERE st.nodeID IN ($str)))
        OR (l.nodeID IN ($str))";
    $links = getRows($sql);
    insertRows($db, $links, 'links', array());
    $linkedNodeIDs = array();
    for($i = 0; $i < count($links); $i++) {
        array_push($linkedNodeIDs, $links[$i]->linkedNodeID);
    }
    insertIntoNodesTable($db, $linkedNodeIDs);
    insertLeafSettings($db, $linkedNodeIDs);
}

function getOneRowSQL($element) {
    $values = array();
    $columns = array();
    foreach ($element as $key => $value) {
        $val = SQLite3::escapeString($value);
        array_push($values, "$key");
        array_push($columns, "'$val'");
    }
    $value_str = implode(',', $values);
    $column_str = implode(',', $columns);
    return " ($value_str) VALUES ($column_str)";
}

function getMultiRowsSQL($element, $i) {
    if(0 == $i) {
        $columns = array();
        foreach ($element as $key => $value) {
            $val = SQLite3::escapeString($value);
            array_push($columns, "'$val' AS '$key'");
        }
        $column_str = implode(',', $columns);
        return " SELECT $column_str";
    }
    $values = array();
    foreach ($element as $key => $value) {
        $val = SQLite3::escapeString($value);
        array_push($values, "'$val'");
    }
    $value_str = implode(',', $values);
    return " UNION SELECT $value_str";
}

function insertRows($db, $elements, $table, $ids) {
    $command = "";
    if(1 == count($elements)) {
        $command = getOneRowSQL($elements[0]);
    } else {
        for($i = 0; $i < count($elements); $i++) {
            if(0 == strcmp($table, 'settings') && 
                ! in_array($elements[$i]->linkedNodeID, $ids)) {
                    $elements[$i]->leaf = 1;
                }
            $command = $command . getMultiRowsSQL($elements[$i], $i);
        }
    }
    $sql = "INSERT OR IGNORE INTO $table $command";
    $stmt = $db -> prepare($sql);
    $stmt -> execute();
}

function exportSQLDatabase($rid, $lang) {
    $tmp_dir = './export';
    shell_exec("mkdir -p $tmp_dir/assets/attachments");
    shell_exec("mkdir -p $tmp_dir/assets/uploads");
    shell_exec("mkdir -p $tmp_dir/db");
    try {
        $db = new PDO("sqlite:$tmp_dir/db/vostan.db");
        $db -> setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        createTables($db);
        $request = \Slim\Slim::getInstance() -> request();
        $input = json_decode($request -> getBody());
        insertIntoNodesTable($db, $input);
        insertIntoSettingsTable($db, $input, $tmp_dir);
        insertIntoLinksTable($db, $input);
        echoResponse(createExportAttachment($tmp_dir, $rid, 'vop'));
    } catch(PDOException $e) {
        shell_exec("rm -rf $tmp_dir");
        echoResponse('{"error":{"export":"' . $e -> getMessage() . '"}}');
    }
}

function exportAllSQLDatabase($rid, $lang) {
    $tmp_dir = './export';
    shell_exec("mkdir -p $tmp_dir");
    shell_exec("mkdir -p $tmp_dir/db");
    shell_exec("cp -r assets $tmp_dir/");
    shell_exec("cp vostan.db $tmp_dir/db/");
    echoResponse(createExportAttachment($tmp_dir, $rid, 'vop'));
}

function exportPresentation($rid, $lang) {
    shellcopy(getBaseDir()."vostan_export", "./export");
    $request = \Slim\Slim::getInstance() -> request();
    $input = json_decode($request -> getBody());
    $data = "{";
    foreach ($input as $key => $value) {
        $data .= '"' . $value . '" : ' . getMapData($value, $lang, true);
        if ($key < count($input) - 1) {
            $data .= ',';
        }
    }
    $data .= "}";

    $str = file_get_contents('export/assets/config.js');
    $str = str_replace("__root__", "$rid", $str);
    $str = str_replace("__data__", "$data", $str);
    file_put_contents('export/assets/config.js', $str);

    shellcopy(getBaseDir()."vostan_lib/vostan.js", "export/assets/lib.js");
    shellcopy(getBaseDir()."vostan_lib/vostan.css", "export/assets/lib.css");
    echoResponse(createExportAttachment('./export', $rid, 'zip'));
}

function shellcopy($source, $dest) {
    shell_exec("cp -r $source $dest");  
}

function exportAllPresentation($rid, $lang) {
    shellcopy(getBaseDir()."vostan_export", "./export");

    $request = \Slim\Slim::getInstance() -> request();
    $db = getConnection();
    $sql = "SELECT nodeID FROM nodes";
    $stmt = $db -> prepare($sql);
    $stmt -> execute();
    $input = $stmt -> fetchAll(PDO::FETCH_OBJ);
    $db = null;

    $data = "{";
    foreach ($input as $key => $item) {
        $value = $item -> nodeID;
        $data .= '"' . $value . '" : ' . getMapData($value, true, true);
        if ($key < count($input) - 1) {
            $data .= ',';
        }
    }
    $data .= "}";
    $str = file_get_contents('export/assets/config.js');
    $str = str_replace("__root__", "$rid", $str);
    $str = str_replace("__data__", "$data", $str);
    file_put_contents('export/assets/config.js', $str);
    shellcopy(getBaseDir()."assets/uploads/*", "export/assets/uploads/");
    shellcopy(getBaseDir()."vostan_lib/vostan.js", "export/assets/lib.js");
    shellcopy(getBaseDir()."vostan_lib/vostan.css", "export/assets/lib.css");
    echoResponse(createExportAttachment('./export', $rid, 'zip'));
}

function appendNode($nid, $rid) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);

    try {
        $db = getConnection();

        $sql1 = "INSERT INTO settings (nodeID, linkedNodeID, top, left, titleHeight, modified)
             VALUES (:rid, :nid, 10, 10, 40, date());";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();

        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"appendNode":"' . $e -> getMessage() . '"}}');
    }
}

function expandNode($nid, $rid, $lang) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);

    try {
        $db = getConnection();

        $sql0 = "SELECT nodeID AS nID FROM links WHERE linkedNodeID = :nid
                 UNION
                 SELECT linkedNodeID AS nID FROM links WHERE nodeID = :nid;";

        $sql = "INSERT OR IGNORE INTO settings (
                    nodeID, 
                    linkedNodeID, 
                    top, 
                    left,
                    width,
                    height,
                    imgWidth,
                    imgHeight,
                    imgLeft,
                    imgTop,
                    titleWidth,
                    titleHeight,
                    titleLeft,
                    titleTop,
                    txtWidth,
                    txtHeight,
                    txtLeft,
                    txtTop,
                    titleInclude,
                    imgInclude,
                    txtInclude,
                    leaf,                 
                    carousel,                 
                    modified)
                SELECT :rid, 
                    nodeID,
                    top, 
                    left,
                    width,
                    height,
                    imgWidth,
                    imgHeight,
                    imgLeft,
                    imgTop,
                    titleWidth,
                    titleHeight,
                    titleLeft,
                    titleTop,
                    txtWidth,
                    txtHeight,
                    txtLeft,
                    txtTop,
                    titleInclude,
                    imgInclude,
                    txtInclude,
                    leaf,
                    carousel,                 
                    date()
                FROM settings WHERE nodeID = :nid AND linkedNodeID = :nid; ";

        $stmt = $db -> prepare($sql0);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $input = $stmt -> fetchAll(PDO::FETCH_OBJ);
        foreach ($input as $key => $item) {
            $nidToAdd = $item -> nID;
            $stmt = $db -> prepare($sql);
            $stmt -> bindParam("rid", $rid);
            $stmt -> bindParam("nid", $nidToAdd);
            $stmt -> execute();
        }

        $db = null;

        getMap($rid, $lang);
        //echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"appendNode":"' . $e -> getMessage() . '"}}');
    }
}

function copySettings($nid, $rid) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();

    try {
        $db = getConnection();

        $sql1 = "SELECT 
                s.nodeID AS 'nodeID',
                s.linkedNodeID AS 'linkedNodeID',
                s.top AS 'top',
                s.left AS 'left',
                s.width AS 'width',
                s.height AS 'height',
                s.imgWidth AS 'imgWidth',
                s.imgHeight AS 'imgHeight',
                s.imgLeft AS 'imgLeft',
                s.imgTop AS 'imgTop',
                s.titleWidth AS 'titleWidth',
                s.titleHeight AS 'titleHeight',
                s.titleLeft AS 'titleLeft',
                s.titleTop AS 'titleTop',
                s.txtWidth AS 'txtWidth',
                s.txtHeight AS 'txtHeight',
                s.txtLeft AS 'txtLeft',
                s.txtTop AS 'txtTop',
                s.titleInclude AS 'titleInclude',
                s.imgInclude AS 'imgInclude',
                s.txtInclude AS 'txtInclude',
                s.leaf AS 'leaf',
                s.carousel AS 'carousel'
                FROM 
                settings s WHERE s.nodeID = :rid and s.linkedNodeID = :nid";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);
        $input = "";

        foreach ($node as $key => $value) {
            $input = $value;
            break;
        }

        $sql2 = "UPDATE settings SET
                width = :width,
                height = :height,
                imgWidth = :imgWidth,
                imgHeight = :imgHeight,
                imgLeft = :imgLeft,
                imgTop = :imgTop,
                titleWidth = :titleWidth,
                titleHeight = :titleHeight,
                titleLeft = :titleLeft,
                titleTop = :titleTop,
                txtWidth = :txtWidth,
                txtHeight = :txtHeight,
                txtLeft = :txtLeft,
                txtTop = :txtTop,
                titleInclude = :titleInclude,
                imgInclude = :imgInclude,
                txtInclude = :txtInclude
                WHERE  linkedNodeID = :nid; ";
        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("nid", $nid);
        $stmt -> bindParam("width", $input -> width);
        $stmt -> bindParam("height", $input -> height);
        $stmt -> bindParam("imgWidth", $input -> imgWidth);
        $stmt -> bindParam("imgInclude", $input -> imgInclude);
        $stmt -> bindParam("imgHeight", $input -> imgHeight);
        $stmt -> bindParam("imgLeft", $input -> imgLeft);
        $stmt -> bindParam("imgTop", $input -> imgTop);
        $stmt -> bindParam("titleWidth", $input -> titleWidth);
        $stmt -> bindParam("titleInclude", $input -> titleInclude);
        $stmt -> bindParam("titleHeight", $input -> titleHeight);
        $stmt -> bindParam("titleLeft", $input -> titleLeft);
        $stmt -> bindParam("titleTop", $input -> titleTop);
        $stmt -> bindParam("txtWidth", $input -> txtWidth);
        $stmt -> bindParam("txtHeight", $input -> txtHeight);
        $stmt -> bindParam("txtLeft", $input -> txtLeft);
        $stmt -> bindParam("txtTop", $input -> txtTop);
        $stmt -> bindParam("txtInclude", $input -> txtInclude);

        $stmt -> execute();

        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"appendNode":"' . $e -> getMessage() . '"}}');
    }
}

function appendNodeToAll($nid, $rid) {
    checkSession();
    try {
        $db = getConnection();

        $sql = "INSERT OR IGNORE INTO settings (
                nodeID, 
                linkedNodeID, 
                top, 
                `left`,
                width,
                height,
                imgWidth,
                imgHeight,
                imgLeft,
                imgTop,
                titleWidth,
                titleHeight,
                titleLeft,
                titleTop,
                txtWidth,
                txtHeight,
                txtLeft,
                txtTop,
                titleInclude,
                imgInclude,
                txtInclude,               
                modified)
                SELECT n.nodeID, 
                :nid,
                s.top, 
                s.left,
                s.width,
                s.height,
                s.imgWidth,
                s.imgHeight,
                s.imgLeft,
                s.imgTop,
                s.titleWidth,
                s.titleHeight,
                s.titleLeft,
                s.titleTop,
                s.txtWidth,
                s.txtHeight,
                s.txtLeft,
                s.txtTop,
                s.titleInclude,
                s.imgInclude,
                s.txtInclude,
                date()
                FROM nodes AS n LEFT JOIN settings AS s ON (s.nodeID = :rid AND s.linkedNodeID = :nid);";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();

        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"appendNodeToAll":"' . $e -> getMessage() . '"}}');
    }
}

function hideNodeFromAll($nid, $rid) {
    checkSession();
    try {
        $db = getConnection();

        $sql = "DELETE FROM settings WHERE nodeID != :rid AND nodeID != :nid AND linkedNodeID = :nid;";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();

        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"hideNodeFromAll":"' . $e -> getMessage() . '"}}');
    }
}

function addSimpleNode($lang) {
    addNode(0, 0, $lang);
}    

function addNode($nid, $rid, $lang) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $txt = $request -> params('attrs');
    $body = $request -> getBody();
    $input = json_decode($body);
    try {
        $db = getConnection();

        $sql1 = "SELECT max(nodeID) FROM nodes;";
        $stmt = $db -> prepare($sql1);
        $stmt -> execute();
        $max_id_db = $stmt -> fetch(PDO::FETCH_NUM);
        $max_id_db = $max_id_db[0];
        $max_id = $max_id_db + 1;

        $sql2 = "";
        if ($lang == "en") {
            $lang = "";
            $sql2 = "INSERT INTO nodes (nodeID, title, img, txt, modified, script, tags, users, viewers, location) VALUES ($max_id, :title, :img, :txt, date(), :script, :tags, :users, :viewers, :location);";
        } else {
            $lang = "_$lang";
            $sql2 = "INSERT INTO nodes (nodeID, title, img, txt$lang, modified, script, tags$lang, users, viewers, title$lang, location) VALUES ($max_id, 'New Node', :img, :txt, date(), :script, :tags, :users, :viewers, :title, :location);";
        }
        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("title", $input -> title);
        $stmt -> bindParam("img", $input -> img);
        $stmt -> bindParam("txt", $input -> txt);
        $stmt -> bindParam("script", $input -> script);
        $stmt -> bindParam("tags", $input -> tags);
        $stmt -> bindParam("users", $input -> users);
        $stmt -> bindParam("viewers", $input -> viewers);
        $stmt -> bindParam("location", $input -> location);
        $stmt -> execute();

        $sql3 = "INSERT INTO settings (nodeID, linkedNodeID, top, left, titleHeight, modified,titleInclude, imgInclude ,txtInclude, leaf)
                 VALUES  ($max_id, $max_id, 300, 300, 40, date(), :titleInclude, :imgInclude, :txtInclude, :leaf);";
        $stmt = $db -> prepare($sql3);
        $stmt -> bindParam("titleInclude", $input -> titleInclude);
        $stmt -> bindParam("imgInclude", $input -> imgInclude);
        $stmt -> bindParam("txtInclude", $input -> txtInclude);
        $stmt -> bindParam("leaf", $input -> leaf);
        $stmt -> execute();

        if ($rid) {
        $sql4 = "INSERT INTO settings (nodeID, linkedNodeID, top, left, titleHeight, modified, titleInclude, imgInclude ,txtInclude, leaf)
                 VALUES ($max_id, :rid, 10, 10, 40, date(), :titleInclude, :imgInclude, :txtInclude, :leaf);";
        $stmt = $db -> prepare($sql4);
        $stmt -> bindParam("titleInclude", $input -> titleInclude);
        $stmt -> bindParam("imgInclude", $input -> imgInclude);
        $stmt -> bindParam("txtInclude", $input -> txtInclude);
        $stmt -> bindParam("leaf", $input -> leaf);
        $stmt -> bindParam("rid", $rid);
        $stmt -> execute();

        $sql5 = "INSERT INTO settings (nodeID, linkedNodeID, width, height, top, left, titleWidth, titleHeight, modified, titleInclude, imgInclude ,txtInclude, leaf, carousel) 
                VALUES (:rid, $max_id, :width, :height, :top, :left, :titleWidth, :titleHeight, date(), :titleInclude, :imgInclude, :txtInclude, :leaf,:carousel);";
        $stmt = $db -> prepare($sql5);
        $stmt -> bindParam("titleInclude", $input -> titleInclude);
        $stmt -> bindParam("imgInclude", $input -> imgInclude);
        $stmt -> bindParam("txtInclude", $input -> txtInclude);
        $stmt -> bindParam("leaf", $input -> leaf);
        $stmt -> bindParam("carousel", $input -> carousel);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("width", $input -> width);
        $stmt -> bindParam("height", $input -> height);
        $stmt -> bindParam("top", $input -> top);
        $stmt -> bindParam("left", $input -> left);
        $stmt -> bindParam("titleWidth", $input -> titleWidth);
        $stmt -> bindParam("titleHeight", $input -> titleHeight);
        $stmt -> execute();
        }

        echoResponse('{"root":' . $rid . ', "node": ' . $max_id . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"addNode":"' . $e -> getMessage() . '"}}');
    }
}

function updateNode($nid, $rid, $lang) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);
    try {
        $db = getConnection();

        $lang = ($lang == "en") ? "" : "_$lang";

        $sql1 = "UPDATE nodes SET title$lang = :title, img = :img, txt$lang = :txt, modified = date(), script = :script, tags$lang = :tags, users = :users, viewers = :viewers, location = :location
                 WHERE nodeID = :nid;";

        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("nid", $nid);
        $stmt -> bindParam("title", $input -> title);
        $stmt -> bindParam("img", $input -> img);
        $stmt -> bindParam("txt", $input -> txt);
        $stmt -> bindParam("script", $input -> script);
        $stmt -> bindParam("tags", $input -> tags);
        $stmt -> bindParam("users", $input -> users);
        $stmt -> bindParam("viewers", $input -> viewers);
        $stmt -> bindParam("location", $input -> location);
        $stmt -> execute();

        $sql2 = "UPDATE settings SET
                top = :top,
                left = :left,
                width = :width,
                height = :height,
                imgWidth = :imgWidth,
                imgHeight = :imgHeight,
                imgLeft = :imgLeft,
                imgTop = :imgTop,
                titleWidth = :titleWidth,
                titleHeight = :titleHeight,
                titleLeft = :titleLeft,
                titleTop = :titleTop,
                txtWidth = :txtWidth,
                txtHeight = :txtHeight,
                txtLeft = :txtLeft,
                txtTop = :txtTop,
                titleInclude = :titleInclude,
                imgInclude = :imgInclude,
                txtInclude = :txtInclude,
                modified = date(),
                leaf = :leaf,
                carousel = :carousel
                WHERE nodeID = :rid AND linkedNodeID = :nid; ";
        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("rid", $rid);
        $stmt -> bindParam("nid", $nid);
        $stmt -> bindParam("top", $input -> top);
        $stmt -> bindParam("left", $input -> left);
        $stmt -> bindParam("width", $input -> width);
        $stmt -> bindParam("height", $input -> height);
        $stmt -> bindParam("imgWidth", $input -> imgWidth);
        $stmt -> bindParam("imgInclude", $input -> imgInclude);
        $stmt -> bindParam("imgHeight", $input -> imgHeight);
        $stmt -> bindParam("imgLeft", $input -> imgLeft);
        $stmt -> bindParam("imgTop", $input -> imgTop);
        $stmt -> bindParam("titleWidth", $input -> titleWidth);
        $stmt -> bindParam("titleInclude", $input -> titleInclude);
        $stmt -> bindParam("titleHeight", $input -> titleHeight);
        $stmt -> bindParam("titleLeft", $input -> titleLeft);
        $stmt -> bindParam("titleTop", $input -> titleTop);
        $stmt -> bindParam("txtWidth", $input -> txtWidth);
        $stmt -> bindParam("txtHeight", $input -> txtHeight);
        $stmt -> bindParam("txtLeft", $input -> txtLeft);
        $stmt -> bindParam("txtTop", $input -> txtTop);
        $stmt -> bindParam("txtInclude", $input -> txtInclude);
        $stmt -> bindParam("leaf", $input -> leaf);
        $stmt -> bindParam("carousel", $input -> carousel);

        $stmt -> execute();

        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"updateNode":"' . $e -> getMessage() . '"}}');
    }
}

function updateLink($rid, $lang) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);
    $lang = ($lang == "en") ? "" : "_$lang";
    try {
        $db = getConnection();
        $sql1 = "UPDATE links SET tags$lang = :tags, modified = date()
            WHERE nodeID = :nid AND linkedNodeID = :lnid;";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("nid", $input -> nodeID);
        $stmt -> bindParam("lnid", $input -> linkedNodeID);
        $stmt -> bindParam("tags", $input -> linkTags);
        $stmt -> execute();
        $db = null;
        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"updateLink":"' . $e -> getMessage() . '"}}');
    }
}

function hideNode($nid, $rid) {
    checkSession();
    try {
        $db = getConnection();
        $sql1 = "DELETE FROM settings WHERE nodeID = :rid AND linkedNodeID = :nid";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("nid", $nid);
        $stmt -> bindParam("rid", $rid);
        $stmt -> execute();
        $db = null;
        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function addLink($rid, $lang) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);
    $tags = ($input -> linkTags) ? $input -> linkTags : "";
    $lang = ($lang == "en") ? "" : "_$lang";
    try {
        $db = getConnection();

        $sql = "INSERT INTO links (nodeID, linkedNodeID, tags$lang, modified)
            VALUES (:nid, :lnid, :tag, date());";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("nid", $input -> nodeID);
        $stmt -> bindParam("lnid", $input -> linkedNodeID);
        $stmt -> bindParam(":tag", $tags);
        $stmt -> execute();
        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function deleteLink($rid) {
    checkSession();
    // get and decode JSON request body
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $input = json_decode($body);
    try {
        $db = getConnection();

        $sql = "DELETE FROM links WHERE nodeID = :nid AND linkedNodeID = :lnid;";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("nid", $input -> nodeID);
        $stmt -> bindParam("lnid", $input -> linkedNodeID);
        $stmt -> execute();
        $db = null;

        echoResponse('{"root":' . $rid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function getAllNodes($text, $lang) {

    $request = \Slim\Slim::getInstance() -> request();
    $txt = $request -> params('term');
    try {
        $db = getConnection();
        $username = getSessionUser();
        $everyone = "all";
        $user_condition = "";
        $user_query_condition = "";
        if (!isAdminUser()) {
            $user_condition = " AND (nodes.users LIKE '%'||'$username'||'%' OR nodes.viewers LIKE '%'||'$username'||'%' OR nodes.viewers LIKE '%'||'$everyone'||'%')";
        }

        $lang = ($lang == "en") ? "" : "_$lang";

        if (!isUserSet()) {
            $querytag = "vostan::query";
            $user_condition = $user_condition . " AND nodes.tags$lang NOT LIKE '%'||'$querytag'||'%'";
        } else {
            $user_query_condition = "nodes.users AS users, nodes.viewers AS viewers,";
        }
        $sql = "SELECT nodeID, nodes.img AS img, nodes.txt, nodes.location, nodes.script AS script, " . $user_query_condition . " nodes.tags$lang AS tags, nodes.title$lang AS title, nodes.title AS defaultTitle, nodes.title$lang || ' [' || nodes.tags$lang  || ']' AS label, nodes.title$lang AS value FROM nodes WHERE (nodes.title$lang LIKE '%'||'$text'||'%' or nodes.tags$lang LIKE '%'||'$text'||'%' or nodes.title LIKE '%'||'$text'||'%' or nodes.tags LIKE '%'||'$text'||'%')$user_condition"; 

        $stmt = $db -> prepare($sql);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);
        if (isUserSet()) {
            foreach ($node as $key => $value) {
                //Set Default User Permission - Viewer, otherwise the node would not be returned
                $value -> user = "viewer";
                if (mb_strpos($value -> users, $username) !== false || isAdminUser()) {
                    $value -> user = "editor";
                }
            }
        }
        $db = null;

        echoResponse(json_encode($node));
    } catch(PDOException $e) {
        echoResponse('{"error":{"getAllNodes":"' . $e -> getMessage() . '"}}');
    }
}

function getAllNodeTags($lang) {
    checkSession();
    $request = \Slim\Slim::getInstance() -> request();
    $txt = $request -> params('term');
    $lang = ($lang == "en") ? "" : "_$lang";
    $sql = "SELECT DISTINCT nodes.tags$lang AS tag FROM nodes WHERE nodes.tags$lang LIKE '%'||'$txt'||'%';";
    getAllTags($sql, $txt);
}

function getAllNodeUsers() {
    checkSession();
    $request = \Slim\Slim::getInstance() -> request();
    $txt = $request -> params('term');
    $sql = "SELECT DISTINCT nodes.title AS user FROM nodes WHERE nodes.tags LIKE '%user%' and nodes.title LIKE '%'||'$txt'||'%';";
    getAllUsers($sql, $txt);
}

function checkIsUserEditor($nid) {
    checkSession();
    $db = getConnection();
    $currUser = $_SESSION['user'];
    $sql = "SELECT users FROM nodes WHERE nodeID = :nid;";
    $stmt = $db -> prepare($sql);
    $stmt -> bindParam('nid', $nid);
    $stmt -> execute();
    $editor = $stmt -> fetchAll(PDO::FETCH_OBJ);
    $userType = isAdminUser() ? "editor" : "viewer";
    foreach ($editor as $i) {
        if (mb_strpos($i -> users, $currUser) !== false) {
            $userType = "editor";
        }

    }
    $db = null;
    echoResponse('{"userType":"' . $userType . '"}');
}

function getAllLinkTags($lang) {
    $request = \Slim\Slim::getInstance() -> request();
    $txt = $request -> params('term');
    $lang = ($lang == "en") ? "" : "_$lang";
    $sql = "SELECT DISTINCT links.tags$lang AS tag FROM links WHERE links.tags$lang LIKE '%'||'$txt'||'%';";
    getAllTags($sql, $txt);
}

function handleListImages() {
    checkSession();
    $path = 'assets/uploads/';
    if (!is_dir($path)) {
        mkdir($path, 0777);
    }
    $dh = scandir($path);
    $images = "";
    for ($i = 0; $i < count($dh); $i++) {
        if (!is_dir($dh[$i]) && $dh[$i] != "." && $dh[$i] != "..") {
            $el = '{"name":"' . $dh[$i] . '","url":"' . $path . $dh[$i] . '"}';
            $images .= $el;
            if ($i < count($dh) - 1) {
                $images .= ",";
            }
        }
    }
    echoResponse('[' . $images . ']');
}

function handleUpload() {
    $path = 'assets/uploads/';
    uploadToDir($path);
}

function handleAttach() {
    $path = 'assets/attachments/';
    uploadToDir($path);
}

function uploadToDir($path) {
    checkSession();
    $request = \Slim\Slim::getInstance() -> request();
    $body = $request -> getBody();
    $exclude_exts = array('php', 'db');
    try {
        $filenames = array_keys($_FILES);
        $filevalues = array_values($_FILES);

        $file = $filevalues[0];
        $fileTmpName = $file['tmp_name'];

        $ext_arr = explode('.', $file['name']);
        $ext = strtolower($ext_arr[count($ext_arr) - 1]);
        if (in_array($ext, $exclude_exts)) {
            echoResponse('{"invalid_file_type":"' . $ext . '"}');
        } else {
            if (!is_dir($path)) {
                mkdir($path, 0777);
            }

            $basefilename = basename($file['name']);
            $filename = $path . $basefilename;

            if (file_exists($path . $file['name'])) {
                echoResponse('{"duplicate":"' . $basefilename . '"}');
            } else {
                move_uploaded_file($fileTmpName, $filename);
                echoResponse('{"name":"' . $basefilename . '","url":"' . $filename . '"}');
            }
        }
    } catch(Exception $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function handleUploadFromURL() {
    $path = 'assets/uploads/';
    uploadFromURL($path);
}

function uploadFromURL($path) {
    try {
        $url = $_POST['url'];
        $url = trim($url);
        if (!empty($url)) {
            $name = basename($url);
            if (strpos($url, '?') !== FALSE) {
                $name = explode("?", $name);
                $name = $name[0];
            }
            $valid_exts = array('jpg', 'jpeg', 'gif', 'png', 'svg');
            $expl_array = explode(".", strtolower($name));
            $ext = end($expl_array);
            if (in_array($ext, $valid_exts)) {
                if (!file_exists("$path/$name")) {
                    $content = file_get_contents($url);
                    $upload = file_put_contents("$path/$name", $content);
                    echoResponse('{"name":"' . $name . '","url":"' . "$path$name" . '"}');
                } else {
                    echoResponse('{"error":{"uploadFromURL":"Duplicated Name: A file with the same name already exists on the server."}}');
                }
            } else {
                echoResponse('{"error":{"uploadFromURL": "Invalid extension of the image. \n Valids are: \'jpg\', \'jpeg\', \'gif\', \'png\'."}}');
            }
        } else {
            echoResponse('{"error": {"uploadFromURL":"Please set the image url."}}');
        }
    } catch (Exception $e) {
        echoResponse('{"error":{"uploadFromURL":"' . $e -> getMessage() . '"}}');
    }
}

function getAllTags($sql, $txt) {
    checkSession();
    try {
        $db = getConnection();

        $stmt = $db -> prepare($sql);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);
        $pieces = array();
        $arr = array();
        foreach ($node as $i) {
            if (mb_strpos($i -> tag, ",") !== false) {
                $res = explode(",", $i -> tag);
                foreach ($res as $r) {
                    if (mb_strpos($r, $txt) !== false) {
                        $pieces[] = trim($r);
                    }
                }
            } else if (mb_strpos($i -> tag, $txt) !== false) {
                $pieces[] = trim($i -> tag);
            }

        }
        foreach (array_unique ($pieces ) as $p) {
            $arr[] = array('tag' => $p);
        }
        $db = null;
        echoResponse(json_encode($arr));
    } catch(PDOException $e) {
        echoResponse('{"error":{"getAllTags":"' . $e -> getMessage() . '"}}');
    }
}

function getAllUsers($sql, $txt) {
    checkSession();
    try {
        $db = getConnection();

        $stmt = $db -> prepare($sql);
        $stmt -> execute();
        $node = $stmt -> fetchAll(PDO::FETCH_OBJ);

        $pieces = array();
        $arr = array();
        foreach ($node as $i) {
            if (mb_strpos($i -> user, ",") !== false) {
                $res = explode(",", $i -> user);
                foreach ($res as $r) {
                    if (mb_strpos($r, $txt) !== false) {
                        $pieces[] = trim($r);
                    }
                }
            } else if (mb_strpos($i -> user, $txt) !== false) {
                $pieces[] = trim($i -> user);
            }

        }
        foreach (array_unique ($pieces ) as $p) {
            $arr[] = array('user' => $p);
        }
        $db = null;
        echoResponse(json_encode($arr));
    } catch(PDOException $e) {
        echoResponse('{"error":{"getAllUsers":"' . $e -> getMessage() . '"}}');
    }
}

function getSubstr($prefix, $postfix, $text) {
    $fPos = strpos($text, $prefix);
    $lPos = strrpos($text, $postfix);
    $str = substr($text, $fPos+1, $lPos-$fPos-1);
    return trim($str);
}

function getPrefix($prefix, $text) {
    $fPos = strpos($text, $prefix);
    $str = substr($text, 0, $fPos);
    return trim($str);
}

function addQueryCondition($query, $condition) {
    if (strlen(trim($query)) > 0 && strlen(trim($condition)) > 0) {
        $query = $query . " AND ";
    } 
    $query = $query . $condition;
    return $query;
}

function getQueryHelper($data, $lang, $rid) {
    $lang = ($lang == "en") ? "" : "_$lang";

    //parseBody
    $qParts = explode(",", getSubstr("(", ")", $data));

    $sortField = getSubstr("(", ")", $qParts[1]);
    $sortOrder = getPrefix("(", $qParts[1]);

    $tagParts = explode(".", $qParts[0]);

    $lParts = $tagParts[0];
    $lType = getPrefix("{", $lParts);

    $lTypeStatement = "(l.nodeID = :rid OR l.linkedNodeID = :rid)";
    $lJoinStatement = "l.linkedNodeID = n.nodeID or l.nodeID = n.nodeID";
    if(strtolower($lType) == "ine") {
        $lTypeStatement = "(l.linkedNodeID = :rid)";
        $lJoinStatement = "l.nodeID = n.nodeID";
    } else if(strtolower($lType) == "oute"){
        $lTypeStatement = "(l.nodeID = :rid)";
        $lJoinStatement = "l.linkedNodeID = n.nodeID";
    } else if(strtolower($lType) == "") {
        $rid = 0;
    } 

    $lOperator = "AND";
    $lParts = getSubstr("{", "}", $lParts);
    if (strlen($lParts) == 0) {
        $lTags = array();
    } else {    
        $lTags = explode("&", $lParts);
        if (sizeOf($lTags) == 1) {
            $lOperator = "OR";
            $lTags = explode("|", $lParts);
        }
    }

    $lTagsLength = sizeOf($lTags);
    $lTagsCondition = "";
    for ($i = 0; $i < $lTagsLength; ++$i) {
        $tag = trim($lTags[$i], '"');
        $lTagsCondition = $lTagsCondition . "(l.tags$lang LIKE '$tag' OR l.tags$lang LIKE '%'||',$tag' OR l.tags$lang LIKE '$tag,'||'%' OR l.tags$lang LIKE '%'||',$tag,'||'%')";
        if ($i != ($lTagsLength - 1)) {
            $lTagsCondition = $lTagsCondition . " " . $lOperator . " ";
        }
    }
    if (strlen($lTagsCondition) > 0) {
        $lTagsCondition = " (" . $lTagsCondition . ") ";
    }

    $nParts = $tagParts[1];
    $nOperator = "AND";
    $nParts = getSubstr("{", "}", $nParts);
    if (strlen($nParts) == 0) {
        $nTags = array();
    } else {    
        $nTags = explode("&", $nParts);
        if (sizeOf($nTags) == 1) {
            $nOperator = "OR";
            $nTags = explode("|", $nParts);
        }
    }

    $nTagsLength = sizeOf($nTags);
    $nTagsCondition = "";

    for ($i = 0; $i < $nTagsLength; ++$i) {
        $tag = trim($nTags[$i], '"');
        $nTagsCondition = $nTagsCondition . "(n.tags$lang LIKE '$tag' OR n.tags$lang LIKE '%'||',$tag' OR n.tags$lang LIKE '$tag,'||'%' OR n.tags$lang LIKE '%'||',$tag,'||'%')";
        if ($i != ($nTagsLength - 1)) {
            $nTagsCondition = $nTagsCondition . " " . $nOperator . " ";
        }
    }
    if (strlen($nTagsCondition) > 0) {
        $nTagsCondition = " (" . $nTagsCondition . ") ";
    }

    $user_condition = getUserQueryCondition();
    $db = getConnection();

    $defLang = getDefaultLang();
    $columns = "n.nodeID AS 'nodeID', n.img AS img,
        n.title$defLang AS defaultTitle, n.title$lang AS 'title',
        n.tags$defLang AS 'defaultTags', n.tags$lang AS 'tags', n.location AS 'location'";
    $query_condititon = "(n.tags$lang not LIKE '%Query%')";

    $query = "";
    $query = addQueryCondition($query, $nTagsCondition);
    $query = addQueryCondition($query, $query_condititon);
    if ($rid) {
        $query = addQueryCondition($query, $lTypeStatement);
        $query = addQueryCondition($query, $lTagsCondition);
        $query = addQueryCondition($query, $user_condition);
        $sql = "SELECT distinct $columns FROM links l
            INNER JOIN nodes n ON $lJoinStatement
            WHERE $query ORDER BY n.$sortField $sortOrder";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("rid", $rid);
    } else {
        $query = addQueryCondition($query, $user_condition);
        $sql = "SELECT distinct $columns FROM nodes n
            WHERE $query ORDER BY n.$sortField $sortOrder";
        $stmt = $db -> prepare($sql);
    }

    $stmt -> execute();
    $nodes = $stmt -> fetchAll(PDO::FETCH_OBJ);

    $db = null;
    return $nodes;
}

function getQuery($lang, $rid) {
    try {
        $request = \Slim\Slim::getInstance() -> request();
        $body = $request -> getBody();
        $nodes = getQueryHelper($body, $lang, $rid);

        echoResponse('{"nodes":' . json_encode($nodes) . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"getQuery":"' . $e -> getMessage() . '"}}');
    }
}

function echoResponse($message) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS');
    header('Access-Control-Max-Age: 1000');
    header('Access-Control-Allow-Headers: Content-Type');

    $res = \Slim\Slim::getInstance() -> response();
    $res['Content-Type'] = 'application/json';
    echo $message;
}

function deleteNode($nid) {
    deleteNodeHandler($nid, false);
}

function deleteNodeFull($nid) {
    deleteNodeHandler($nid, true);
}

function deleteNodeHandler($nid, $fullDelete) {
    checkSession();
    try {
        $db = getConnection();
        $sql = "SELECT * FROM nodes WHERE nodeID = :nid";
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $img_arr = $stmt -> fetchAll(PDO::FETCH_OBJ);
        foreach ($img_arr as $node) {
            if (($node -> tags == "attachment" || $fullDelete) && file_exists($node -> img)) {
                unlink($node -> img);
            }
        }

        $sql1 = "DELETE FROM settings WHERE nodeID = :nid OR linkedNodeID = :nid";
        $sql2 = "DELETE FROM links WHERE nodeID = :nid OR linkedNodeID = :nid";
        $sql3 = "DELETE FROM nodes WHERE nodeID = :nid";
        $stmt = $db -> prepare($sql1);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $stmt = $db -> prepare($sql2);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $stmt = $db -> prepare($sql3);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $db = null;
        echoResponse('{"deleted node":' . $nid . '}');
    } catch(PDOException $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function downloadNode($nid) {
    try {
        $user_condition = getUserCondition();
        $db = getConnection();
        $sql = "SELECT * FROM nodes WHERE nodeID = :nid". $user_condition;
        $stmt = $db -> prepare($sql);
        $stmt -> bindParam("nid", $nid);
        $stmt -> execute();
        $img_arr = $stmt -> fetchAll(PDO::FETCH_OBJ);
        $db = null;
        $file = sizeof($img_arr) > 0 ? $img_arr[0] -> img : "";
        if (file_exists($file)) {
            header('Content-Description: File Transfer');
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename='.basename($file));
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($file));
            ob_clean();
            flush();
            readfile($file);
            exit;
        } else {
            echoResponse('{"error":{"text":"Unable to read the file."}}');
        }
    } catch(PDOException $e) {
        echoResponse('{"error":{"text":"' . $e -> getMessage() . '"}}');
    }
}

function pasteNode($nid, $root, $rid) {
        checkSession();
        try {
            $db = getConnection();

            $sql = "INSERT OR IGNORE INTO settings (
                nodeID, 
                linkedNodeID, 
                top, 
                `left`,
                width,
                height,
                imgWidth,
                imgHeight,
                imgLeft,
                imgTop,
                titleWidth,
                titleHeight,
                titleLeft,
                titleTop,
                txtWidth,
                txtHeight,
                txtLeft,
                txtTop,
                titleInclude,
                imgInclude,
                txtInclude,
                leaf,
                carousel,
                modified)
                SELECT :rid, 
                :nid,
                s.top, 
                s.left,
                s.width,
                s.height,
                s.imgWidth,
                s.imgHeight,
                s.imgLeft,
                s.imgTop,
                s.titleWidth,
                s.titleHeight,
                s.titleLeft,
                s.titleTop,
                s.txtWidth,
                s.txtHeight,
                s.txtLeft,
                s.txtTop,
                s.titleInclude,
                s.imgInclude,
                s.txtInclude,
                s.leaf,
                s.carousel,
                date()
                FROM settings AS s WHERE s.nodeID = :root AND s.linkedNodeID = :nid;";
            $stmt = $db -> prepare($sql);
            $stmt -> bindParam("rid", $rid);
            $stmt -> bindParam("nid", $nid);
            $stmt -> bindParam("root", $root);
            $stmt -> execute();

            $db = null;

            echoResponse('{"root":' . $rid . '}');
        } catch(PDOException $e) {
            echoResponse('{"error":{"pasteNode":"' . $e -> getMessage() . '"}}');
        }
}

/* END API Handlers */
?>

<?php
/* SQL Connection Helper Functions */
function getConnection($argv) {
	$vostan = "";
	if (isset($argv)) {
		$vostan = $argv[1];
	} else {
		$vostan = $_GET['argument1'];
	}
	$dbh = new PDO("sqlite:$vostan");

	$dbh -> setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $dbh;
}

/* Function to upgrade vostan.db
 * - add tags_hy and tags_ru columns to the link table of vostan.db
 * - add new table to db for versioning
 * */
function upgradeDb($argv){
    $db = getConnection($argv);

    try {
        // Add tags_hy column
        $sql1 = "ALTER TABLE links ADD tags_hy TEXT DEFAULT '';";
        $stmt = $db -> prepare($sql1);
        $stmt -> execute();

        // Add tags_ru column
        $sql2 = "ALTER TABLE links ADD tags_ru TEXT DEFAULT '';";
        $stmt = $db -> prepare($sql2);
        $stmt -> execute();

        $sql3 = "INSERT INTO versions VALUES ('1.7', 'Link tags localization')";
        $stmt = $db -> prepare($sql3);
        $stmt -> execute();
    } catch(PDOException $e) {
        echo '{"error": "' . $e -> getMessage() . '"}';
    }
}

upgradeDb($argv);

?>

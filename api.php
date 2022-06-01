<?php
	require "InteractionsRestService.php";

	// All requests to the web service are routed through this script.

	$service = new InteractionsRestService();
	$service->handleRawRequest();
?>

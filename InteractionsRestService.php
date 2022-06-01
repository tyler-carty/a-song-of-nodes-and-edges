<?php

	//Include the database info, interaction class and the base RESTful API class

    require "dbinfo.php";
    require "RestService.php";
    require "Edge.php";
	require "Node.php";

	//Class to handle the RESTful API requests, suh as displaying the list of interactions and filtering them

class InteractionsRestService extends RestService
{
	private $data;
    
	public function __construct() 
	{
		// Passing in the string 'got_all_character_interactions' to the base constructor ensures that all
		// requests are in the form http://server/got_all_character_interactions/[parameters]
		parent::__construct("got");
	}

	// Function to handle the GET requests depending on the URL parameters
	public function performGet($url, $parameters, $requestBody, $accept) 
	{
		switch (count($parameters))
		{
			case 1:
				$this->methodNotAllowedResponse();
				break;
			case 2:
				if($parameters[1] == "asoiaf_all_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_all_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif($parameters[1] == "asoiaf_book1_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_book1_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif($parameters[1] == "asoiaf_book2_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_book2_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif($parameters[1] == "asoiaf_book3_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_book3_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif($parameters[1] == "asoiaf_book4_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_book4_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif($parameters[1] == "asoiaf_book5_edges"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllEdges($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				elseif ($parameters[1] == "asoiaf_book5_nodes"){
					// If there is only one parameter, the full table of data is requested
					header('Content-Type: application/json; charset=utf-8');
					// This header is needed to stop IE cacheing the results of the GET
					header('no-cache,no-store');
					$this->getAllNodes($parameters[1]);
					echo json_encode($this->data);
					break;
				}
				break;

			default:	
				$this->methodNotAllowedResponse();
		}
	}

	public function performPut($url, $parameters, $requestBody, $accept)
	{
		global $dbserver, $dbusername, $dbpassword, $dbdatabase;

		$newNode = $this->extractNodeFromJSON($requestBody);
		$connection = new mysqli($dbserver, $dbusername, $dbpassword, $dbdatabase);

		if (!$connection->connect_error)
		{
			$sql = "update $parameters[1] set label = ?, house = ? where id = ?";
			// We pull the fields of the book into local variables since
			// the parameters to bind_param are passed by reference.
			$statement = $connection->prepare($sql);
			$nodeID = $newNode->getCharacterID();
			$label = $newNode->getCharacterLabel();
			$house = $newNode->getCharacterHouse();
			$statement->bind_param('sss', $label, $house, $nodeID);
			$result = $statement->execute();
			if ($result == FALSE)
			{
				$errorMessage = $statement->error;
			}
			$statement->close();
			$connection->close();
			if ($result == TRUE)
			{
				// We need to return the status as 204 (no content) rather than 200 (OK) since
				// we are not returning any data
				$this->noContentResponse();
			}
			else
			{
				$this->errorResponse($errorMessage);
			}
		}
	}

	// Function to get all the edges from the database, unfiltered
    private function getAllEdges($url)
    {
		global $dbserver, $dbusername, $dbpassword, $dbdatabase;
	
		$connection = new mysqli($dbserver, $dbusername, $dbpassword, $dbdatabase);
		if (!$connection->connect_error)
		{
			$query = "select interaction_id, source, target, weight, book from $url";
			if ($result = $connection->query($query))
			{
				while ($row = $result->fetch_assoc())
				{
					$this->data[] = new Edge($row["interaction_id"], $row["source"], $row["target"], $row["weight"], $row["book"]);
				}
				$result->close();
			}
			$connection->close();
		}
	}

	// Function to get all the edges from the database, unfiltered
	private function getAllNodes($url)
	{
		global $dbserver, $dbusername, $dbpassword, $dbdatabase;

		$connection = new mysqli($dbserver, $dbusername, $dbpassword, $dbdatabase);
		if (!$connection->connect_error)
		{
			$query = "select id, label, house from $url";
			if ($result = $connection->query($query))
			{
				while ($row = $result->fetch_assoc())
				{
					$this->data[] = new Node($row["id"], $row["label"], $row["house"]);
				}
				$result->close();
			}
			$connection->close();
		}
	}

	private function extractNodeFromJSON($requestBody)
	{
		// This function is needed because of the perculiar way json_decode works.
		// By default, it will decode an object into a object of type stdClass.  There is no
		// way in PHP of casting a stdClass object to another object type.  So we use the
		// approach of decoding the JSON into an associative array (that's what the second
		// parameter set to true means in the call to json_decode). Then we create a new
		// Book object using the elements of the associative array.  Note that we are not
		// doing any error checking here to ensure that all of the items needed to create a new
		// book object are provided in the JSON - we really should be.
		$nodeArray = json_decode($requestBody, true);
		$node = new Node($nodeArray['ID'],
			$nodeArray['Label'],
			$nodeArray['House']);
		unset($nodeArray);
		return $node;
	}

}
?>

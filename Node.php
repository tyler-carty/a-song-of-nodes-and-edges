<?php

//A class to represent an interaction between two characters
//Houses the interaction and book/character data from the JSON data stream

class Node
{
    public $CharacterID;
    public $CharacterLabel;
    public $CharacterHouse;

    public function __construct($id, $label, $house)
    {
        $this->CharacterID = $id;
        $this->CharacterLabel = $label;
        $this->CharacterHouse = $house;
    }

    public function getCharacterID()
    {
        return $this->CharacterID;
    }

    public function getCharacterLabel()
    {
        return $this->CharacterLabel;
    }

    public function getCharacterHouse()
    {
        return $this->CharacterHouse;
    }
}
?>

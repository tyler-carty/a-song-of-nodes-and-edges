<?php

//A class to represent an interaction between two characters
//Houses the interaction and book/character data from the JSON data stream

class Edge
{
    public $InteractionID;
    public $SourceCharacter;
    public $TargetCharacter;
    public $InteractionWeight;
    public $InteractionBook;

    public function __construct($id, $source, $target, $weight, $book)
    {
        $this->InteractionID = $id;
        $this->SourceCharacter = $source;
        $this->TargetCharacter = $target;
        $this->InteractionWeight = $weight;
        $this->InteractionBook = $book;
    }

    public function getInteractionID()
    {
        return $this->InteractionID;
    }

    public function getSourceCharacter()
    {
        return $this->SourceCharacter;
    }

    public function getTargetCharacter()
    {
        return $this->TargetCharacter;
    }

    public function getInteractionWeight()
    {
        return $this->InteractionWeight;
    }

    public function getInteractionBook()
    {
        return $this->InteractionBook;
    }
}
?>

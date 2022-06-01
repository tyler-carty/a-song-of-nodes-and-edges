// FUNCTION TO HANDLE CHARACTER SEARCH
function handleSearch(){

    // GET THE SEARCH TERM & NODE/LINK INFORMATION
    var text = document.getElementById("myVal").value.toLowerCase();

    let graphFound = false;
    let tableFound = false;

    var nodes = d3.selectAll('.node')
    var links = d3.selectAll('.link')

    var rows = document.getElementById("table-interactions").rows;

    // IF THE SEARCH TERM IS EMPTY, HIDE ALL NODES & LINKS
    if (text === '') {
        nodes.style('opacity', 1); 
        nodes.style('stroke', 'none');
        links.style('opacity', 0.2);

        // for each row in the table
        for (var i = 1; i < rows.length; i++) {
            // show the row
            rows[i].style.display = "";
        }
        return false;
    }

    // check all rows in the table, see if text = any of the rows
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var cells = row.cells;

        // get the value of the source and target columns

        var source = cells[1].innerHTML.toLowerCase();
        var target = cells[2].innerHTML.toLowerCase();

        // if text is not a substring of source and target, hide the row. otherwise, show the row
        if (source.indexOf(text) === -1 && target.indexOf(text) === -1) {
            row.style.display = 'none';
        }
        else {
            tableFound = true;
            row.style.display = '';
        }
    }

    // RESET OPACITIES, HIDE ALL NODES & LINKS
    nodes.style('opacity', 0.1); 
    nodes.style('stroke', 'none');
    links.style('opacity', 0);

    // FOR EACH NODE, CHECK IF THE SEARCH TERM IS IN THE NODE'S NAME OR HOUSE
    nodes.each(function(d, i) {
        var node = d3.select(this);

        if ((d.label.toLowerCase()).includes(text) || (d.group.toLowerCase()).includes(text)) {
            graphFound = true;

            // SHADE THE NODE ONCE A MATCH IS FOUND
            node.style('opacity', 1.0);
            node.style('stroke', '#39383d');
        }
    })

    // if the network element is visible
    if (document.getElementById("network").style.display !== 'none') {
        if (!graphFound) {
            searchSnackbar();
        }
    }

    // if the table element is visible
    if (document.getElementById("all-interactions").style.display === 'block') {
        if (!tableFound) {
            searchSnackbar();
            rows[0].style.display = "none";
        }
        else{
            rows[0].style.display = "";
        }
    }
    
    return false;
}

// FUNCTION TO HANDLE SEARCH AFTER SETTING myVal TO THE VALUE OF THE KEY
function handleSearchKey(key){

    // SET THE SEARCH TERM TO THE KEY
    document.getElementById("myVal").value = key;
    handleSearch();
}

function editSnackbar(){
    var x = document.getElementById("editSnackbar");
    displaySnackbar(x)
}

function searchSnackbar(){
    var x = document.getElementById("searchSnackbar");
    displaySnackbar(x)
}

function displaySnackbar(snackbar) {
    // Get the snackbar DIV & edit its class
    var x = snackbar;
    x.className = "show";

    // After 3 seconds, remove the show attribute from the class definition
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}
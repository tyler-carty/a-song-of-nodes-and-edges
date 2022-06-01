/* CREATE NEW D3 GRAPH IN THE HTML DIV "NETWORK"
   ALSO SET THE CONTAINER TO BE USED BY THE GRAPH */
let graphObject = d3.select('#network');
let graphContainer = graphObject.append('g');

/* ASSIGN THE DIMENSIONS OF THE CONTAINER */
let width = +graphObject.attr('width');
let height = +graphObject.attr('height');

/* FIND THE CENTER OF THE CONTAINER */
let widthCenter = width / 2;
let heightCenter = height / 2;

/* DETERMINE SAFE VALUES FOR NODE STRENGTH (TO DETERMINE THEIR SIZE) */
let strengthMin = Number.MAX_SAFE_INTEGER, strengthMax = Number.MIN_SAFE_INTEGER;
let inMax = 100, inMin = 10;

/* HANDLE THE INITIAL DIMENSIONS, ZOOMING AND TRANSLATION OF THE GRAPH */
let zoom;

graphObject.call(
    zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', function() {
            graphContainer.attr('transform', d3.event.transform);
        })
    )
    .call(zoom.transform, d3.zoomIdentity.translate(500, 350).scale(0.1));

/* CREATE TOOLTIP FOR EACH NODE, SHOWN ON HOVER */
let tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

/* USED TO COMBINE NODE DATA FROM MULTIPLE CSV FILES */
let nodesData;
let cInfoName = ''; // Keeps track of the current character clicked on
let cNodeInfo = []; // Keeps track of the current node info

/* DETERMINES THE SCALEPOINT OF THE GRAPH TO ENSURE DATA IS SPACED NICELY */
let scaleCenter = d3.scalePoint().padding(-2).range([0.1, width]);


/* LOADS THE "ALL BOOKS" OPTION WHEN THE PAGE IS LOADED */
let book = 'all';

/* HANDLES THE DROPDOWN CHOICE BY UPDATING THE CHART */
function onBookChanged() {
    let select = d3.select('#bookSelect').node();
    let bookSelected = select.options[select.selectedIndex].value;
    if (bookSelected !== book) {
        book = bookSelected;
        updateGraph();
    }
}

/* DETERMINES WHETHER THE USER WANTS TO GROUP BY HOUSE NAME */
let groupHouses = false;
let tabularRequested = false;
let mstSigRequested = false;

/* LISTENS FOR BUTTON PRESSES FROM THE USER */
document.querySelector('#clusterBtn').addEventListener('click', clusterClick);
document.querySelector('#tabularBtn').addEventListener('click', tabularClick);
document.querySelector('#mostSignificantBtn').addEventListener('click', mstSigClick);
document.querySelector('#editNode').addEventListener('click', editClick);
document.querySelector('#applyChanges').addEventListener('click', submitEditCharacter);

/* HANDLES THE CLICK OF THE MOST SIGNIFICANT CHARACTER BUTTON */
function mstSigClick() {
    closeInfoNav();
    closeEditNav();

    mstSigRequested = !mstSigRequested;
    let btn = d3.select('#mostSignificantBtn');
    btn.classed('btn-selected', mstSigRequested);

    let infoPanel = d3.select('#mostSignificantInfo');

    if (mstSigRequested) {
        setSigPanel(infoPanel);
    }
    else {
        closeSigNav();
    }

}

/* HANDLES WHAT HAPPENS WHEN THE USER CLICKS THE TABULAR BUTTON */
function tabularClick() {
    closeInfoNav();
    closeEditNav();
    closeSigNav()
    document.getElementById("myVal").value = "";

    updateGraph();

    tabularRequested = !tabularRequested;
    let btn = d3.select('#tabularBtn');
    btn.classed('btn-selected', tabularRequested);

    let tabularTable = d3.select('#tabularTable');
    setTabularData(tabularTable);
}

/* HANDLES WHAT HAPPENS WHEN THE USER CLICKS THE EDIT BUTTON */
function editClick() {
    closeInfoNav();
    closeSigNav();
    let infoPanel = d3.select('#editCharacterInfo');
    setEditPanel(infoPanel, cNodeInfo);
}

/* HANDLES WHAT HAPPENS WHEN THE USER CLICKS THE CLUSTER BUTTON */
function clusterClick() {
    groupHouses = !groupHouses;
    let btn = d3.select('#clusterBtn');
    btn.classed('btn-selected', groupHouses);
    updateGraph();
}

/* CARRIES OUT AN INITIAL CHART UPDATE */
updateGraph();

/* FUNCTION TO CARRY OUT CHART UPDATES WHEN REQUESTED
   DATA IS LOADED FROM CSV FILES LOCALLY
   DATA IS THEN ASSIGNED TO APPROPRIATE VARIABLES*/
function updateGraph() {
    Promise.all([
        d3.json("/got/asoiaf_" + book + "_edges").then(function(json){
            return json.map(function(d) {
                return {
                    interaction_id: d.InteractionID,
                    source: d.SourceCharacter,
                    target: d.TargetCharacter,
                    weight: d.InteractionWeight,
                    book: d.InteractionBook
                };
            });
        }),
        d3.json("/got/asoiaf_" + book + "_nodes").then(function(json){
            return json.map(function(d) {
                return {
                    id: d.CharacterID,
                    label: d.CharacterLabel,
                    house: d.CharacterHouse
                };
            });
        })
    ]).then(files => {
        let links = files[0];
        let nodesFile = files[1];

        graphContainer.selectAll('*').remove();

        closeEditNav();
        closeInfoNav();

        // IF THE SIG CLICK BUTTON IS ACTIVE, CALL MSTSIGCLICK()
        if (mstSigRequested) {
            mstSigClick();
        }

        /* UPDATES THE TABLE WITH THE DATA */
        createInteractionsTable(links);

        /* UPDATES THE SIDEBAR WITH THE DATA */
        createSignificantChart(links);

        /* HOLDS NODE DATA SUCH AS ID, NAME AND HOUSE */
        nodesData = {};

        /* CREATE NODES FROM LINKS DATA */
        links.forEach(link => {
            createNodes(link);
        });

        /* ADD HOUSE FROM NODES CSV TO NODE OBJECTS */
        nodesFile.forEach(node => {
            addFields(node);
        });

        /* DETERMINES THE STRENGTH OF A NODE */
        let nodes = d3.values(nodesData);
        nodes.forEach(node => {
            convertStrength(node);
        });

        /* DETERMINES THE ATTRIBUTES OF A LINK, SENDS TO GRAPH CONTAINER */
        let link = graphContainer
            .append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-width', d => {
                return Math.sqrt(d.weight);
            });

        /* DETERMINES THE ATTRIBUTES OF A NODE, SENDS TO GRAPH CONTAINER */
        let node = graphContainer
            .append('g')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', d => {
                return d.strength;
            })
            .style('fill', d => {
                return d.color;
            });

        /* DETERMINES THE POSITION OF THE LABEL TOOLTIP ON HOVER */
        node.on('mousemove', () => {
            tooltip
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 25) + "px")
        });

        /* USES THE DETERMINED SCALE FROM EARLIER */
        scaleCenter.domain(bookHouses["all"]);

        /* DETERMINE THE PHYSICS OF THE NODES DEPENDING ON WHETHER THEY ARE GROUPED BY HOUSE */
        if (!groupHouses) {
            const simulation = d3
                .forceSimulation()
                .nodes(nodes).on('tick', ticked)
                .force(
                    'link',
                    d3
                        .forceLink(links)
                        .id(d => {
                            return d.id;
                        })
                        .distance(350)
                        .strength(0.2)
                )
                .force('charge', d3.forceManyBody().strength(-1000))
                .force('center', d3.forceCenter(widthCenter, heightCenter))
                .force("x", d3.forceX())
                .force("y", d3.forceY())
                .force("collide", d3.forceCollide().radius(d => { return d.strength + 10; }).iterations(2));
        } else {
            const simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(0))
                .force("charge", d3.forceManyBody())
                .force("y", d3.forceY(height / 2).strength(0.1))
                .force("x", d3.forceX(d => {
                    return scaleCenter(d.group);
                }).strength(0.95))
                .force("collide", d3.forceCollide().radius(d => { return d.strength + 1; }).iterations(2));

            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);
        }

        /* HANDLE NODE HOVER FOR TOOLTIP DISPLAY */
        node.on('mouseover', d => {
            // EMPTIES THE SEARCHBAR
            document.getElementById("myVal").value = "";

            // DISPLAYS THE TOOLTIP
            tooltip.style("visibility", "visible")
                .html(() => {
                    const content = `<strong>Name:</strong> <span>${d.label}</span>`+'<br>'
                        +`<strong>House:</strong> <span>${d.group}</span>`;

                    return content;
                });

            // DETERMINES THE OPACITY OF THE NODE AND LINKS
            node.style('opacity', n => {
                if (n === d || d.neighbors.includes(n.id)) {
                    return 1.0;
                } else {
                    return 0.1;
                }
            });

            node.style('stroke', n => {
                if (n === d || d.neighbors.includes(n.id)) {
                    return 'black';
                } else {
                    return 'none';
                }
            });

            link.style('opacity', l => {
                if (d === l.source || d === l.target) {
                    return 1.0;
                } else {
                    return 0;
                }
            });
        });

        /* HANDLE EXIT FROM NODE HOVER FOR TOOLTIP DESTROY */
        node.on('mouseout', function() {
            tooltip.style("visibility", "hidden");
            node.style('opacity', 1.0);
            node.style('stroke', 'none');
            link.style('opacity', 0.1);
            handleSearch();
        });

        /* HANDLE NODE CLICK WITH CHARACTER INFO PANEL */
        node.on('click', function(d) {
            closeEditNav();
            if (mstSigRequested){
                mstSigClick()
            }
            let infoPanel = d3.select('#characterInfo');
            if (cInfoName !== '' && cInfoName === d.id) {
                closeInfoNav(cInfoName);
            } else {
                cInfoName = d.id;
                cNodeInfo = d;
                setInfoPanel(infoPanel, d);
            }
        })

        /* DETERMINES THE POSITION OF THE NODE */
        function ticked() {
            link
                .attr('x1', d => { return d.source.x; })
                .attr('y1', d => { return d.source.y; })
                .attr('x2', d => { return d.target.x; })
                .attr('y2', d => { return d.target.y; });

            node.attr('cx', d => {
                return d.x;
            }).attr('cy', d => {
                return d.y;
            });
        }
    });
}

/* CREATES A NEW NODE OBJECT INSIDE NODESDATA OR RETURNS EXISTING */
function createNode(name) {
    return (
        nodesData[name] ||
        (nodesData[name] = {
            id: name,
            group: '',
            neighbors: [],
            color: '', // color determined by house
            bff: [], // [0: name of character with highest link weight, 1: the link weight]
            strength: 0, // cumulative link weights
        })
    );
}

/* CREATE TWO NODE OBJECTS FROM A LINK BETWEEN THOSE CHARACTERS (TARGET & SOURCE) */
function createNodes(link) {
    let sourceData = createNode(link.source);
    sourceData.neighbors.push(link.target);
    sourceData.strength += +link.weight;
    // DETERMINE IF THE STRONGEST LINK NEEDS REPLACING
    if (sourceData.bff.length === 0 || +link.weight > sourceData.bff[1]) {
        sourceData.bff[0] = link.target;
        sourceData.bff[1] = +link.weight;
    }
    checkMaxMin(sourceData.strength);

    let targetData = createNode(link.target);
    targetData.neighbors.push(link.source);
    targetData.strength += +link.weight;
    // DETERMINE IF THE STRONGEST LINK NEEDS REPLACING
    if (targetData.bff.length === 0 || +link.weight > targetData.bff[1]) {
        targetData.bff[0] = link.source;
        targetData.bff[1] = +link.weight;
    }
    checkMaxMin(targetData.strength);
}

/* UPDATE MIN/MAX STRENGTHS AFTER NEW NODE CREATED */
function checkMaxMin(val) {
    if (val > strengthMax) strengthMax = val;
    if (val < strengthMin) strengthMin = val;
}

/* ADD HOUSE FIELD TO NODE OBJECT */
function addFields(node) {
    let sourceData = createNode(node.id);
    let nodeColor = determineColor(node);
    sourceData.color = nodeColor;
    sourceData.group = node.house;
    sourceData.label = node.label;
}

/* CONVERT STRENGTH VALUE TO NUMBER WITHIN RANGE */
function convertStrength(node) {
    let val = convertNumberToRange(node.strength, strengthMin, strengthMax, inMin, inMax);
    node.strength = val;
}

/* SET THE INFO PANEL TO INCLUDE CURRENT CHARACTER INFO*/
function setInfoPanel(panel, node) {
    panel.select('.extra').style('display', 'none');

    panel.select('#tName').text(node.label);
    panel.select('#tHouse').text(node.group);
    panel.select('#tLinks').text(node.neighbors.length);
    panel.select('#tClosestLink').text(node.bff[0]);

    panel.style('width', '250px');
}

/* SET THE EDIT PANEL TO INCLUDE CURRENT CHARACTER INFO*/
function setEditPanel(panel, node) {
    panel.select('.extra').style('display', 'none');
    panel.style('width', '250px');

    // switch case for book value

    switch (book) {
        case 'book1':
            panel.select('#eCurrentBook').text("A Game of Thrones");
            break;
        case 'book2':
            panel.select('#eCurrentBook').text("A Clash of Kings");
            break;
        case 'book3':
            panel.select('#eCurrentBook').text("A Storm of Swords");
            break;
        case 'book4':
            panel.select('#eCurrentBook').text("A Feast for Crows");
            break;
        case 'book5':
            panel.select('#eCurrentBook').text("A Dance with Dragons");
            break;
        case 'all':
            panel.select('#eCurrentBook').text("A Song of Ice and Fire");

    }

    panel.select('#eCurrentlyEditing').text(node.label);
    document.getElementById('editID').value = node.id;
    document.getElementById("editName").value = node.label;
    document.getElementById("editHouse").value = node.group;
}

/* SET THE MOST SIG PANEL TO INCLUDE CHARACTER INFO*/
function setSigPanel(panel) {
    panel.select('.extra').style('display', 'none');
    panel.style('width', '350px');
}

/* SET THE TABULAR TABLE TO INCLUDE CURRENT CHARACTER INFO */
function setTabularData(table) {
    // hide network graph if it is shown, show if it is hidden
    if (d3.select('#network').style('display') === 'none') {
        d3.select('#network').style('display', 'block');
    } else {
        d3.select('#network').style('display', 'none');
    }

    // hide cluster button if it is shown, show if it is hidden
    if (d3.select('#clusterBtn').style('display') === 'none') {
        d3.select('#clusterBtn').style('display', 'block');
    } else {
        d3.select('#clusterBtn').style('display', 'none');
    }

    // show interactions table if it is hidden, hide if it is shown
    if (d3.select('#all-interactions').style('display') === 'none') {
        d3.select('#all-interactions').style('display', 'block');
    } else {
        d3.select('#all-interactions').style('display', 'none');
    }

}

/* DETERMINE GROUP COLOR */
function determineColor(node) {
    switch(node.house) {
        case "Stark":
            return '#7B9070';
        case "Baratheon":
            return '#E7D271';
        case "Targaryen":
            return '#A71414';
        case "Tyrell":
            return '#34936A';
        case "Tully":
            return '#4F729E';
        case "Greyjoy":
            return '#0D0D0D';
        case "Lannister":
            return '#BB6861';
        case "Arryn":
            return '#638497';
        case "Martell":
            return '#D99061';
        default:
            return '#3d3d3d';
    }
}

/* CLOSE CHARACTER INFO PANEL */
function closeInfoNav() {
    d3.select('.sideTabular.right').style('width', 0);
    cInfoName = '';
}

/* CLOSE EDIT INFO PANEL */
function closeEditNav() {
    d3.select('.sideTabular.left').style('width', 0);
    cNodeInfo = [];
}

/* CLOSE SIG INFO PANEL */
function closeSigNav() {
    d3.select('.sideTabular.chart').style('width', 0);
}

d3.select('.closebtn.right').on('click', closeInfoNav);
d3.select('.closebtn.left').on('click', closeEditNav);
d3.select('.closebtn.chart').on('click', mstSigClick);

/* SUBMIT FORM ON EDIT INFO PANEL */
function submitEditCharacter() {

    // if nodeInfo.label == editName.value or nodeInfo.group == editHouse.value

    let editName = document.getElementById("editName").value;
    let editHouse = document.getElementById("editHouse").value;

    if (editName !== cNodeInfo.label || editHouse !== cNodeInfo.group) {
        var editedNode = {
            ID: $('#editID').val(),
            Label: $('#editName').val(),
            House: $('#editHouse').val()
        };

        $.ajax({
            url: '/got/asoiaf_' + book + '_nodes',
            type: 'PUT',
            data: JSON.stringify(editedNode),
            contentType: "application/json;charset=utf-8",
            success: function () {
                closeEditNav();
                updateGraph();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert(jqXHR + '\n' + textStatus + '\n' + errorThrown);
            }
        });
    }
    else {
        editSnackbar();
    }

}

/* POPULATES THE INTERACTIONS TABLE */
function createInteractionsTable(interactions) {

    var strResult = '<div class="col-md-12">' +
        '<table class="table" id="table-interactions">' +
        '<col style="width: 10%">' +
        '<col style="width: 35%">' +
        '<col style="width: 35%">' +
        '<col style="width: 10%">' +
        '<col style="width: 10%">' +
        '<thead>' +
        '<tr>' +
        '<th>ID</th>' +
        '<th>Source</th>' +
        '<th>Target</th>' +
        '<th>Weight</th>' +
        '<th>Book</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';
    $.each(interactions, function (index, interaction)
    {
        strResult += "<tr><td>" + interaction.interaction_id + "</td><td> " + interaction.source + "</td><td>" + interaction.target + "</td><td>" + interaction.weight + "</td><td>" + interaction.book + "</td></tr>";
    });
    strResult += "</tbody></table>";
    $("#all-interactions").html(strResult);
}

/* POPULATES THE SIGNIFICANT SIDEBAR BAR CHART */
function createSignificantChart(links){

    let chartStatus = Chart.getChart("sigChart");
    if (chartStatus !== undefined) {
        chartStatus.destroy();
    }

    //for each interaction in files[0], find the target and weight of the interaction
    //if the target is in the list of nodes, add the weight to the target's weight
    //if the target is not in the list of nodes, add the target and weight to the list of nodes

    var nodes = [];
    for (var i = 0; i < links.length; i++) {

        if(links[i].target.includes("Stark")){
            var colour = "#7B9070";
        }
        else if(links[i].target.includes("Baratheon")){
            var colour = "#E7D271";
        }
        else if(links[i].target.includes("Targaryen")){
            var colour = "#A71414";
        }
        else if(links[i].target.includes("Tyrell")){
            var colour = "#34936A";
        }
        else if(links[i].target.includes("Tully")){
            var colour = "#4F729E";
        }
        else if(links[i].target.includes("Greyjoy")){
            var colour = "#0D0D0D";
        }
        else if(links[i].target.includes("Lannister")){
            var colour = "#BB6861";
        }
        else if(links[i].target.includes("Arryn")){
            var colour = "#638497";
        }
        else if(links[i].target.includes("Martell")){
            var colour = "#D99061";
        }
        else{
            var colour = "#3d3d3d";
        }

        var target = links[i].target;
        var weight = links[i].weight;
        var found = false;
        for (var j = 0; j < nodes.length; j++) {
            if (nodes[j].id === target) {
                // convert weight to int
                nodes[j].weight += parseInt(weight);
                found = true;
            }
        }
        if (!found) {
            nodes.push({
                id: target,
                weight: parseInt(weight),
                colour: colour
            });
        }
    }

    //sort the nodes by weight
    nodes.sort(function (a, b) {
        return b.weight - a.weight;
    });

    //remove all but the first 5 nodes
    nodes = nodes.slice(0, 5);

    //create the chart using the nodes
    var chart = new Chart(document.getElementById("sigChart"), {
        type: 'bar',
        data: {
            labels: nodes.map(function (node) {
                return node.id;
            }),
            datasets: [{
                label: 'Total Interaction Weight by Character',
                backgroundColor: nodes.map(function (node) {
                    return node.colour;
                }),
                data: nodes.map(function (node) {
                    return node.weight;
                })
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: { display: false },
            title: {
                display: true,
                text: 'Total Interaction Weight'
            }
        }
    });
}

/* CLAMP VALUES TO VALID RANGE */
function convertNumberToRange (val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/* DETERMINES THE HOUSES THAT ARE AVAILABLE TO BE VISUALISED */
let bookHouses = {
    all: ['Misc', 'Stark', 'Targaryen', 'Lannister', 'Baratheon', 'Tyrell', 'Martell', 'Greyjoy', 'Arryn', 'Tully']
}

export { onBookChanged };
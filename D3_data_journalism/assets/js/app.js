
var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
}

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "poverty";

// function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
      d3.max(censusData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

function renderText(textGroup, newXScale, chosenXAxis) {

    textGroup.transition()
      .duration(1000)
      .attr("x", d => newXScale(d[chosenXAxis]));
  
    return textGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  var label;

  if (chosenXAxis === "poverty") {
    label = "In Poverty (%):";
  }
  else {
    label = "Age (Median):";
  }

  var label2 = ("Lack Healthcare:");


  var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([180, -60])
    .html(function(d) {
      return (`${d.state}<br>${label} ${d[chosenXAxis]}<br>${label2}${d.healthcare}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function(censusData, err) {
  if (err) throw err;

  // parse data
  censusData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.age = +data.age;
    data.healthcare = +data.healthcare;
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(censusData, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(censusData, d => d.healthcare)])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(censusData)
    .enter()
    .append("circle")    
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.healthcare))
    .attr("r", 20)
    .attr("class", "stateCircle");

  var textGroup = chartGroup.selectAll("stateText")
    .data(censusData)
    .enter()
    //.append("circle")
    .append("text")
    .text(d => { return d.abbr })
    .classed("stateText", true)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d.healthcare))
    .attr("dy", 5)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    

      


  // Create group for two x-axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("Poverty (%)");

  var ageLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age (Median)");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Lacks Healthcare (%)");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup );
  

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(censusData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);
        textGroup = renderText(textGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "age") {
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else {
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
        }
      }
    });
}).catch(function(error) {
  console.log(error);
});


// // @TODO: YOUR CODE HERE!
// var svgWidth = 960;
// var svgHeight = 500;

// var margin = {
//   top: 20,
//   right: 40,
//   bottom: 80,
//   left: 100
// };

// var width = svgWidth - margin.left - margin.right;
// var height = svgHeight - margin.top - margin.bottom;

// // Create an SVG wrapper, append an SVG group that will hold our chart,
// // and shift the latter by left and top margins.
// var svg = d3
//   .select("#scatter")
//   .append("svg")
//   .attr("width", svgWidth)
//   .attr("height", svgHeight);

//   // Append an SVG group
// var chartGroup = svg.append("g")
// .attr("transform", `translate(${margin.left}, ${margin.top})`);

// // Initial Params
// var chosenXAxis = "Poverty";
// // var chosenYAxis="Healthcare";

// // function used for updating x-scale var upon click on axis label
// function xScale(censusData, chosenXAxis) {
//     // create scales
//     var xLinearScale = d3.scaleLinear()
//       .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.8,
//         d3.max(censusData, d => d[chosenXAxis]) * 1.2
//       ])
//       .range([0, width]);
  
//     return xLinearScale;
  
//   }
  
// //   function yScale(censusData, chosenYAxis) {
// // //     // create scales
// //     var xLinearScale = d3.scaleLinear()
// //       .domain([d3.min(censusData, d => d[chosenYAxis]) * 0.8,
// //         d3.max(censusData, d => d[chosenYAxis]) * 1.2
// //       ])
// //       .range([height, 0]);
  
// //     return xLinearScale;
  
// //   }

// // function used for updating xAxis var upon click on axis label
// function renderAxes(newXScale, xAxis) {
//     var bottomAxis = d3.axisBottom(newXScale);
  
//     xAxis.transition()
//       .duration(1000)
//       .call(bottomAxis);
  
//     return xAxis;
// }

// // function used for updating yAxis var upon click on axis label
// // function renderAxes(newYScale, yAxis) {
// //     var leftAxis = d3.axisLeft(newYScale);
  
// //     yAxis.transition()
// //       .duration(1000)
// //       .call(leftAxis);
  
// //     return yAxis;
// // }

// // function used for updating circles group with a transition to
// // new circles
// function renderCircles(circlesGroup, newXScale, chosenXAxis,) {  
//     circlesGroup.transition()
//       .duration(1000)
//       .attr("cx", d => newXScale(d[chosenXAxis]));
//     //   .attr("cy", d=> newYScale(d[chosenYAxis]));    
  
//     return circlesGroup;
//   }


//   function renderText(textGroup, newXScale, chosenXAxis,) {

//     textGroup.transition()
//       .duration(1000)
//       .attr("cx", d => newXScale(d[chosenXAxis]));
//     //   .attr("cy", d=> newYScale(d[chosenYAxis]));
  
//     return textGroup;
//   }

// //   function updatestyleX(value,chosenXAxis) {

// //     if(choseXAxis === "poverty"){
// //         return '${value}(%)';
// //     }
// //     else if (chosenXAxis === "income"){
// //         return "$${value}";
// //     }
// //     else {
// //         return "${value}";
// //     }
// // }



// // function used for updating circles group with new tooltip
//   function updateToolTip(chosenXAxis, circlesGroup) {  //add , chosenYAxis back into parantheiss

//     var label;
//     var ylabel;

//     if(chosenXAxis === "poverty"){
//         label = 'Poverty: ';
//     }
//     else if (chosenXAxis ==="income"){
//         label = "Income: "
//     }
//     else {
//         label= "Age (in years): "
//     };


//     // if (chosenYAxis === "healthcare") {                    
//     //     ylabel = "Without Healthcare: ";
//     // }
//     // else if (chosenYAxis === "obesity"){
//     //     ylabel = "Obesity: ";
//     // }
//     // else {
//     //     ylabel = "Smokers: "
//     // };

//     var toolTip = d3.tip()
//     .attr("class", "d3-tip")
//     .offset([180, -60])  //change to [-8, 0]?
//     .html(function(d) {
//         // return (`${d.state}<br>${xlabel} ${d[chosenXAxis]}`);

//       return (`${d.state} (${d.abbr}) <br> ${label} ${d[chosenXAxis]}`);
//     });  

//     circlesGroup.call(toolTip);

//     circlesGroup.on("mouseover", function(data) {
//         toolTip.show(data);
//       })
//         // onmouseout event
//         .on("mouseout", function(data, index) {
//           toolTip.hide(data);
//         });
    
//       return circlesGroup;

// }




// // Retrieve data from the CSV file and execute everything below
// d3.csv("assets/data/data.csv").then(function(censusData,err) {
//     if (err) throw err;

// // console.log(censusData);

//     censusData.forEach(data=> {
//         data.poverty = +data.poverty;
//         data.obesity = +data.obesity;
//         data.age = +data.age;
//         data.income = +data.income;
//         data.smokes = +data.smokes;
//         data.healthcare = +data.healthcare;
//     });
//     // xLinearScale function above csv import
//     var xLinearScale = xScale(censusData, chosenXAxis);

//     var yLinearScale = d3.scaleLinear()
//     .domain([0, d3.max(censusData, d => d.healthcare)])
//     .range([height, 0]);

//     var bottomAxis = d3.axisBottom(xLinearScale);
//     var leftAxis = d3.axisLeft(yLinearScale);

//      // append x axis
//     var xAxis = chartGroup.append("g")
//     .classed("x-axis", true)
//     .attr("transform", `translate(0, ${height})`)
//     .call(bottomAxis);

//      // append y axis
// //   var yAxis = 
//   chartGroup.append("g")
// //   .classed("y-axis",true) 
//   .call(leftAxis);
  
//   var circlesGroup = chartGroup.selectAll("circle")
//   .data(censusData)
//   .enter()
//   .append("circle")
// //   .classed("stateCircle", true)
//   .attr("cx", d => xLinearScale(d[chosenXAxis]))
// //   .attr("cy", d => yLinearScale(d[chosenYAxis]))
//   .attr("r", 10)
//   .attr("class", "stateCircle");
// //   .attr("opacity", ".4");

//     // create label inside cirle    
//     // var textGroup = chartGroup.selectAll("stateText")
//     // .data(censusData)
//     // .enter()
//     // .append("text")
//     // .classed("stateText", true)
//     // .attr("x", d => xLinearScale(d[chosenXAxis]))
//     // // .attr("y", d => yLinearScale(d[chosenYAxis]))
//     // .attr("dy", 5)
//     // .attr("font-size", "10px")
//     // .text(function(d) {return d.abbr});

//     var textGroup = chartGroup.selectAll("stateText")
//     .data(censusData)
//     .enter()
//     //.append("circle")
//     .append("text")
//     .text(d => { return d.abbr })
//     .classed("stateText", true)
//     .attr("x", d => xLinearScale(d[chosenXAxis]))
//     .attr("y", d => yLinearScale(d.healthcare))
//     .attr("dy", 5)
//     .attr("font-size", "12px")
//     .attr("font-weight", "bold")

//     var labelsGroup = chartGroup.append("g")
//     .attr("transform", `translate(${width / 2}, ${height + 20 + margin.top})`);

//     var povertyLabel = labelsGroup.append("text")
//     .attr("x", 0)
//     .attr("y", 20)
//     .attr("value", "poverty") // value to grab for event listener
//     .classed("active", true)
//     .text("Poverty (%): ");

//     // var incomeLabel = xLabelsGroup.append("text")
//     // .attr("x", 0)
//     // .attr("y", 20)
//     // .attr("value", "income") // value to grab for event listener
//     // .classed("active", true)
//     // .text("Income: ");
        
//     var ageLabel = labelsGroup.append("text")
//     .attr("x", 0)
//     .attr("y", 20)
//     .attr("value", "age") // value to grab for event listener
//     .classed("inactive", true)
//     .text("Age (in years): ");

//     // var yLabelsGroup = chartGroup.append("g")
//     // .attr("transform", `translate(${0 - margin.left/4}, ${(height/2)})`);

//     // var smokesLabel = yLabelsGroup.append("text")
//     // .attr("x", 0)
//     // .attr("y", 0-20)
//     // .attr("value", "smokersHigh") // value to grab for event listener
//     // .classed("active", true)
//     // .text("Smokers High (%): ");

//     // var healthcareLabel = yLabelsGroup.append("text")
//     // .attr("x", 0)
//     // .attr("y", 0-40)
//     // .attr("value", "smokersHigh") // value to grab for event listener
//     // .classed("active", true)
//     // .text("Healthcare (%): ");

    
//     // var obesityLabel = yLabelsGroup.append("text")
//     // .attr("x", 0)
//     // .attr("y", 0-60)
//     // .attr("value", "age") // value to grab for event listener
//     // .classed("active", true)
//     // .text("Obesity (%): ");

//     chartGroup.append("text")
//     .attr("transform", "rotate(-90)")
//     .attr("y", 0 - margin.left)
//     .attr("x", 0 - (height / 2))
//     .attr("dy", "1em")
//     .classed("axis-text", true)
//     .text("Lacks Healthcare (%)");
    
//     // updateToolTip function above csv import
//   var circlesGroup = updateToolTip(chosenXAxis, circlesGroup, textGroup);

//   labelsGroup.selectAll("text")
//   .on("click", function() {
//     // get value of selection
//     var value = d3.select(this).attr("value");
//     if (value !== chosenXAxis) {

//       // replaces chosenXAxis with value
//       chosenXAxis = value;

//       // console.log(chosenXAxis)

//       // functions here found above csv import
//       // updates x scale for new data
//       xLinearScale = xScale(censusData, chosenXAxis);

//       // updates x axis with transition
//       xAxis = renderAxes(xLinearScale, xAxis);

//       // updates circles with new x values
//       circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis,);
//       textgroup = renderText(circlesGroup, xLinearScale, chosenXAxis,);
//       // updates tooltips with new info
//       circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

//     //   if (chosenXAxis === "poverty") {
//     //     povertyLabel
//     //       .classed("active", true)
//     //       .classed("inactive", false);
//     //     incomeLabel
//     //       .classed("active", false)
//     //       .classed("inactive", true);
//     //     ageLabel
//     //       .classed("active", false)
//     //       .classed("inactive", true);
//     //   }
//     //   else
//        if (chosenXAxis === "age") {
//         // povertyLabel
//         // .classed("active", true)
//         // .classed("inactive", false);
//       ageLabel
//         .classed("active", true)
//         .classed("inactive", false);
//       povertyLabel
//         .classed("active", false)
//         .classed("inactive", true);
//       }
//       else{
//         povertyLabel
//           .classed("active", true)
//           .classed("inactive", false);
//         ageLabel
//           .classed("active", false)
//           .classed("inactive", true);
//         //   incomeLabel
//         //   .classed("active", true)
//         //   .classed("inactive", false);
//             }
//          }
//     });

// //y axis labels event listener
// // yLabelsGroup.selectAll("text")
// // .on("click", function() {
// //     //get value of selection
// //     var value = d3.select(this).attr("value");

// //     //check if value is same as current axis
// //     if (value != chosenYAxis) {

// //         //replace chosenYAxis with value
// //         chosenYAxis = value;

// //         //update y scale for new data
// //         yLinearScale = yScale(censusData, chosenYAxis);

// //         //update x axis with transition
// //         yAxis = renderAxesY(yLinearScale, yAxis);

// //         //update circles with new y values
// //         circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

// //         //update text with new y values
// //         textGroup = renderText(textGroup, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis)

// //         //update tooltips with new info
// //         circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

// //         //change classes to change bold text
// //         if (chosenYAxis === "obesity") {
// //             obesityLabel.classed("active", true).classed("inactive", false);
// //             smokesLabel.classed("active", false).classed("inactive", true);
// //             healthcareLabel.classed("active", false).classed("inactive", true);
// //         } else if (chosenYAxis === "smokes") {
// //             obesityLabel.classed("active", false).classed("inactive", true);
// //             smokesLabel.classed("active", true).classed("inactive", false);
// //             healthcareLabel.classed("active", false).classed("inactive", true);
// //         } else {
// //             obesityLabel.classed("active", false).classed("inactive", true);
// //             smokesLabel.classed("active", false).classed("inactive", true);
// //             healthcareLabel.classed("active", true).classed("inactive", false);
// //         }
// //     }
// // });
// }).catch(function(error){
//     console.log(error);
// });


// @TODO: YOUR CODE HERE!
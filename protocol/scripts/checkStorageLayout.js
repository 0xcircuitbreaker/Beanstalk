const axios = require("axios");
const PRNumber = 133

async function getData(PRNumber) {
  let files = await axios.get(`https://api.github.com/repos/BeanstalkFarms/Beanstalk/pulls/${PRNumber}/files`)
  let data = files.data
  let appStorageData = data.find(
    (d) => d.filename === "protocol/contracts/beanstalk/AppStorage.sol"
  );
  if (appStorageData) {
    let patch = appStorageData.patch;
    let lines = patch.split("\n");
    let addedLinesArray = [];
    let removedLinesArray = [];
    lines.forEach((line) => {
      if (line.startsWith("+") && line.trim() !== "") {
        addedLinesArray.push(line);
      } else if (line.startsWith("-") && line.trim() !== "") {
        removedLinesArray.push(line);
      }
    });

    let filteredAddedLines = filterLines(addedLinesArray, "+");
    let filteredRemovedLines = filterLines(removedLinesArray, "-");
    filteredAddedLines = filteredAddedLines.filter((fal) => !!fal);
    filteredRemovedLines = filteredRemovedLines.filter((fal) => !!fal);
    
    
    let len = filteredAddedLines.length;
    for (let i = 0; i < len; i++) {
      let j = filteredRemovedLines.indexOf(filteredAddedLines[i])
      if (j > -1) {
        filteredRemovedLines.splice(j,1)
        filteredAddedLines.splice(i,1)
        i--;
        len--;
      }
    }

    if(filteredAddedLines.length || filteredRemovedLines.length) {
      console.log("Added Lines:")
      filteredAddedLines.forEach(fal => console.log(fal))
      console.log("Removed Lines:")
      filteredRemovedLines.forEach(fal => console.log(fal))
  
      console.log("================================================")
      console.log("OOPS!! There is DIFFERENCE of AppStorage.sol in this PR")
      console.log("================================================")      
    } else {
      console.log("================================================")
      console.log("CONGRATULATIONS!! There is NO DIFFERENCE of AppStorage.sol in this PR")
      console.log("================================================")      
    }
    
  } else {
    console.log("================================================")
    console.log("CONGRATULATIONS!! This PR does not have any chance in AppStorage.sol")
    console.log("================================================")      
  }
}

function filterLines(lines, symbol) {
  return lines.map((line) => {
    line = line.replace(symbol, "");
    line = line.split("//")[0];
    line = line.trim();
    return line;
  });
}

getData(PRNumber);
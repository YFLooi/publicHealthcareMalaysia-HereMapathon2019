const docsAvailable = {
    global: 15.0,
    japan: 24.0,
    malaysia: 15.8,
    johor: 12.1,
    kedah: 14.2,
    kelantan: 11.9,
    melaka: 20.5,
    negeriSembilan: 21.0,
    pahang: 13.9,
    perak: 16.6,
    perlis: 21.7,
    pulauPinang: 20.1,
    sabah: 8.9,
    sarawak: 14.0,
    selangor: 16.4,
    terengganu: 14.8,
    kl: 33.4,
    labuan: 8.7,
    putrajaya: 10.2
}
const bedsAvailable = {
    global: 27.0,
    japan: 134.0,
    malaysia: 19.8,
    johor: 13.8,
    kedah: 12.3,
    kelantan: 13.8,
    melaka: 15.3,
    negeriSembilan: 16.2,
    pahang: 13.9,
    perak: 22.1,
    perlis: 15.7,
    pulauPinang: 12.0,
    sabah: 12.0,
    sarawak: 14.2,
    selangor: 8.4,
    terengganu: 13.3,
    kl: 27.3,
    labuan: 12.2,
    putrajaya: 59.3
}
const states = [
    "global", "japan", "malaysia", "johor", "kedah", "kelantan", "melaka", 
    "negeriSembilan", "pahang","perak", "perlis", "pulauPinang", "sabah", 
    "sarawak", "selangor", "terengganu", "kl", "labuan", "putrajaya" 
]

function barSwitch(dataType){
    const availableBarLabels = document.getElementsByClassName("progressBarLabel")
    const availableBars = document.getElementsByClassName("progressBar")

    if(dataType === "doctors"){
        for(i = 0; i < availableBars.length; i++){
            let width = docsAvailable[states[i]]*100/34;

            //Prevents bar from extending beyond container
            if(width > 100){
                availableBars[i].style.width = `100%`;    
            } else {
                availableBars[i].style.width = `${width}%`;
            }
            availableBars[i].innerHTML = docsAvailable[states[i]].toFixed(1);

            //Highlights active data set
            document.getElementById("docsAvailable").style.border = "4px solid red"
            document.getElementById("bedsAvailable").style.border = "4px solid black"
        }
    }
    if(dataType === "beds"){
        for(i = 0; i < availableBars.length; i++){
            let width = bedsAvailable[states[i]]*100/50;

            //Prevents bar from extending beyond container
            if(width > 100){
                availableBars[i].style.width = `100%`;    
            } else {
                availableBars[i].style.width = `${width}%`;
            }
            availableBars[i].innerHTML = bedsAvailable[states[i]].toFixed(1);

            //Highlights active data set
            document.getElementById("docsAvailable").style.border = "4px solid black"
            document.getElementById("bedsAvailable").style.border = "4px solid red"
        }
    }
}
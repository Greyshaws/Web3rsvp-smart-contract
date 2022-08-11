// import hardhat
const hre = require("hardhat");

const main = async () => {

    // deploy smart contract to testnet
    const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
    const rsvpContract = await rsvpContractFactory.deploy();
    await rsvpContract.deployed();
    console.log("Contract deployed to:", rsvpContract.address);

    // get deployer wallet address and others for testing
    const [deployer, address1, address2] = await hre.ethers.getSigners();

    // define event data we will use using IPFS CID
    let deposit = hre.ethers.utils.parseEther("1");
    let maxCapacity = 3;
    let timestamp = 1718926200;
    let eventDataCID = "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

    // create a new event with our mock data
    // Once the transaction is done, txn.wait will return data about the transaction
    // including an array of the emitted events which we can log to our console.
    let txn = await rsvpContract.createNewEvent(
        timestamp,
        deposit,
        maxCapacity,
        eventDataCID
    );
    let wait = await txn.wait();
    console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);

    let eventID = wait.events[0].args.eventID;
    console.log("EVENT ID:", eventID);

    // have each account we pulled from getSigners RSVP to the event
    txn = await rsvpContract.createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);
    
    txn = await rsvpContract.connect(address1).createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);
    
    txn = await rsvpContract.connect(address2).createNewRSVP(eventID, { value: deposit });
    wait = await txn.wait();
    console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

    // confirm all of the RSVPs with confirmAllAttendees
    txn = await rsvpContract.confirmAllAttendees(eventID);
    wait = await txn.wait();
    wait.events.forEach((event) => console.log("CONFIRMED:", event.args.attendeeAddress));

    //Test handling of unclaimed deposits by simulating time has exceeded 7day limit
    // wait 10 years
    await hre.network.provider.send("evm_increaseTime", [15778800000000]);
    
    txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
    wait = await txn.wait();
    console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
const connectWalletButton = document.getElementById("connect-wallet");

let userAddress = "";
let contract; // Will hold the smart contract instance
let tokencontract;

const tokenAddress = $_GET("token")
if (!tokenAddress){
    window.location.href="/"
}

//Pour l'ERC20 :
let symbol="ACT";
let decimals=18;
let TokenName="Action";
let totalAVendre=0;
let price=0;
var QteApprouvee=0;
var userBalance=0;


const CONTRACT_ADDRESS = "0x18f8B885025726A463E68b7B3065359C86D1Ea18";
const SEPOLIA_CHAIN_ID = "0xAA36A7"; // Hexadecimal for 11155111

// Check if MetaMask is available
if (typeof window.ethereum) {
    console.log("MetaMask is available");
} else {
    alert("MetaMask is not installed. Please install it to use this DApp.");

}


function $_GET(param) {
	var vars = {};
	window.location.href.replace( location.hash, '' ).replace( 
		/[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
		function( m, key, value ) { // callback
			vars[key] = value !== undefined ? value : '';
		}
	);

	if ( param ) {
		return vars[param] ? vars[param] : null;	
	}
	return vars;
}

// Function to fetch the contract ABI
async function fetchContractABI() {
    try {
        const response = await fetch("abi.json");
        if (!response.ok) {
            throw new Error("Failed to fetch ABI file");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching ABI:", error);
        return null;
    }
}

async function fetchERC20ABI() {
    try {
        const response = await fetch("abierc20.json");
        if (!response.ok) {
            throw new Error("Failed to fetch ABI file");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching ABI:", error);
        return null;
    }
}

// Function to switch to Sepolia network
async function switchToSepolia() {
    try {
        await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        console.log("Switched to Sepolia network");
    } catch (switchError) {
        // If the network is not added to MetaMask, attempt to add it
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: SEPOLIA_CHAIN_ID,
                            chainName: "Sepolia Test Network",
                            nativeCurrency: {
                                name: "Sepolia Ether",
                                symbol: "ETH",
                                decimals: 18,
                            },
                            rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"],
                            blockExplorerUrls: ["https://sepolia.etherscan.io"],
                        },
                    ],
                });
                console.log("Sepolia network added and switched");
            } catch (addError) {
                console.error("Error adding Sepolia network:", addError);
            }
        } else {
            console.error("Error switching network:", switchError);
        }
    }
}

// Function to connect MetaMask
async function connectMetaMask() {
    try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        userAddress = accounts[0];
        console.log("Connected account:", userAddress);

        // Check the network
        const currentChainId = await ethereum.request({ method: "eth_chainId" });
        if (currentChainId !== SEPOLIA_CHAIN_ID) {
            //await switchToSepolia();
        }

        // Display the game section
        connectWalletButton.hidden = true;
        document.getElementById("loading").hidden=false
        
        // Fetch ABI and initialize the contract
        const CONTRACT_ABI = await fetchContractABI();
        if (!CONTRACT_ABI) return;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        const ERC20_ABI = await fetchERC20ABI();
        if (!ERC20_ABI) return;
        tokencontract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        updateAll()

    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
    }
}

async function updateAll(onglet=0){
    document.getElementById("loading").hidden=false
    document.getElementById("topmenu").classList.add("hidden")
    buyWindow.classList.add("hidden")
    sellWindow.classList.add("hidden")
    
    symbol= await tokencontract.symbol();
    decimals= await tokencontract.decimals();
    TokenName= await tokencontract.name();
    window.title.innerHTML=TokenName+" : D-Exchange"
    totalAVendre = await contract.avaible(tokenAddress);
    try{
        price = await contract.priceFor(tokenAddress, 10**decimals);
    } catch{
        price = "Inconnu"
    }
    
    QteApprouvee = await tokencontract.allowance(userAddress, CONTRACT_ADDRESS);
    userBalance = await tokencontract.balanceOf(userAddress);
    updateData()
    document.getElementById("Balance").innerHTML=userBalance/10**decimals
    document.getElementById("loading").hidden=true
    document.getElementById("topmenu").classList.remove("hidden")
    if (onglet==0){
        buyWindow.classList.remove("hidden")
    } else {
        sellWindow.classList.remove("hidden")
    }
    AouV()
}

function updateData(){
    document.querySelectorAll("#Symbol").forEach((i)=>{i.innerHTML=symbol})
    document.querySelectorAll("#name").forEach((i)=>{i.innerHTML=TokenName})
    window.title.innerHTML=TokenName+" : D-Exchange"
    document.getElementById("MaxAVendre").innerHTML=totalAVendre/10**decimals
    document.getElementById("actualPrice").innerHTML=price/10**18
    document.getElementById("buyEthInput").value=price/10**18
    document.getElementById("approuvedQuantity").innerHTML=QteApprouvee/10**decimals
}

async function validTransact(transact, onglet=0){
    document.getElementById("loading").innerHTML="Transaction en cours..."
    document.getElementById("loading").hidden=false
    document.getElementById("topmenu").classList.add("hidden")
    buyWindow.classList.add("hidden")
    sellWindow.classList.add("hidden")
    const receipt = await transact.wait();
    document.getElementById("loading").innerHTML="Chargement..."
    updateAll(onglet)
}

function AouV(){
    vente=parseFloat(document.getElementById("sellAmountInput").value)*10**decimals
    if (QteApprouvee<vente){
        approveSellBtn.hidden=false
        sellBtnModal.hidden=true
    } else {
        approveSellBtn.hidden=true
        sellBtnModal.hidden=false
    }
}

async function Approuve(){
    const inputValue = document.getElementById("sellAmountInput").value;
    const vente = ethers.BigNumber.from(ethers.utils.parseUnits(inputValue, decimals));
    const sale = await tokencontract.approve(CONTRACT_ADDRESS, vente)
    validTransact(sale, 1)
}

async function Sell(){
    const inputValue = document.getElementById("sellAmountInput").value;
    const vente = ethers.BigNumber.from(ethers.utils.parseUnits(inputValue, decimals));
    ChoosenPrice=ethers.utils.parseEther(document.getElementById("sellPriceInput").value)
    const sale = await contract.sell(tokenAddress, vente, ChoosenPrice)
    validTransact(sale, 1)
}
etat=1
function touchToken(){
    etat=1
    document.getElementById("buyQuantityInput").classList.add("touched")
    document.getElementById("buyEthInput").classList.remove("touched")   
    document.getElementById("recalculateBuyBtn").hidden=false
    document.getElementById("confirmBuyBtn").hidden=true
}

function touchETH(){
    etat=-1
    document.getElementById("buyQuantityInput").classList.remove("touched")
    document.getElementById("buyEthInput").classList.add("touched")
    document.getElementById("recalculateBuyBtn").hidden=false
    document.getElementById("confirmBuyBtn").hidden=true
}

function formatToDecimal(number) {
    return number.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 20 });
}

async function recalculate(){
    if (etat==1){
        const inputValue = document.getElementById("buyQuantityInput").value;
        const prix = ethers.BigNumber.from(ethers.utils.parseUnits(inputValue, decimals));
        eth = await contract.priceFor(tokenAddress, prix)
        document.getElementById("buyQuantityInput").classList.remove("touched")
        document.getElementById("buyEthInput").value=formatToDecimal(eth/10**18)
        document.getElementById("recalculateBuyBtn").hidden=true
        document.getElementById("confirmBuyBtn").hidden=false
        etat=0
    } else {
        eth = await contract.priceWith(tokenAddress, ethers.utils.parseEther(document.getElementById("buyEthInput").value))
        document.getElementById("buyEthInput").classList.remove("touched")  
        document.getElementById("buyQuantityInput").value=formatToDecimal(eth/10**decimals)
        document.getElementById("recalculateBuyBtn").hidden=true
        document.getElementById("confirmBuyBtn").hidden=false
        etat=0
    }
}

async function buy(){
    vente=ethers.utils.parseEther(document.getElementById("buyEthInput").value)
    try{
    const sale = await contract.buy(tokenAddress, {value:vente})
    validTransact(sale)
} catch{
    alert("une erreur est survenue")
}
}

//contract.buy(tokenAddress, {value:225000000000000})



// Event listener for the connect wallet button
document.getElementById("sellAmountInput").addEventListener("input", AouV)
document.getElementById("buyQuantityInput").addEventListener("input", touchToken)
document.getElementById("buyEthInput").addEventListener("input", touchETH)

document.getElementById("approveSellBtn").addEventListener("click", Approuve)
document.getElementById("sellBtnModal").addEventListener("click", Sell)
document.getElementById("recalculateBuyBtn").addEventListener("click", recalculate)
document.getElementById("confirmBuyBtn").addEventListener("click", buy)

connectWalletButton.addEventListener("click", connectMetaMask);

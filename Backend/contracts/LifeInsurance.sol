// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "usingtellor/contracts/UsingTellor.sol";
import { LifeInsuranceToken } from "./LifeInsuranceToken.sol";

/// @title life insurance contract
/// @author group 1 Encode bootcamp
/// @notice
/// @dev

contract LifeInsurance is UsingTellor {

	event OracleResult(uint result);


	uint256 public constant THRESHOLD = 10000000000000000;
	uint256 public constant COMMISSION_RATE = 1; // 1% commission rate
	LifeInsuranceToken public paymentToken;
	/// @notice Amount of tokens given per ETH paid
	uint256 public purchaseRatio = 1000;

	uint256 public commissionCollectedTotal;  // track total commissions gathered
	uint256 public totalTokens; // track total investor shares


    // testing variables only.
    uint256 public currentTestTime;   // for testing monthly payments and etc.
    uint256 public deathTestValue;  // value of more than 0 to indicate dead just for testing purpose


	struct Policy {
		uint256 coverageAmount;
		uint256 monthlyPremium;
		uint256 dueDate; // UNIX timestamp of next due date
		uint256 lateFee; // Amount added to the premium if it is paid after the due date
		uint256 endDate;
		bool isActive;
	}

	struct PolicyholderInfo {
		uint age;
		bool smoker;
		uint weight;
	}

	mapping(address => Policy) public policies;
	mapping(address => PolicyholderInfo) public policyholders;
	// Total amount of commissions accrued per token
	mapping(address => uint256) public pendingWithdrawals;
	// Mapping to track investor token balances
	mapping(address => uint256) public investorTokenBalance;
	mapping(address => uint256) public commissionCollected;

	/// @notice Constructor function
	/// @param tokenName Name of the token used for payment
	/// @param tokenSymbol Symbol of the token used for payment
	/// @param _purchaseRatio Amount of tokens given per ETH paid
	constructor(
		string memory tokenName,
		string memory tokenSymbol,
		uint256 _purchaseRatio,
		address payable _tellorAddress // Adding the Tellor address parameter
	) UsingTellor(_tellorAddress) {
		paymentToken = new LifeInsuranceToken(tokenName, tokenSymbol);
		purchaseRatio = _purchaseRatio;
	}

	/// @notice Life Insurance is in business now!
	modifier whenLifeInsuranceIsReady() {
		require(
			address(this).balance >= THRESHOLD,
			"Life Insurance is ready for Insurers"
		);
		_;
	}

	function getBtcSpotPrice(uint256 maxTime) internal view returns (uint256) {
		bytes memory _queryData = abi.encode(
			"SpotPrice",
			abi.encode("btc", "usd")
		);
		bytes32 _queryId = keccak256(_queryData);

		(bytes memory _value, uint256 _timestampRetrieved) = getDataBefore(
			_queryId,
			block.timestamp - 20 minutes
		);
		if (_timestampRetrieved == 0) return 0;
		require(
			block.timestamp - _timestampRetrieved < maxTime,
			"Maximum time elapsed"
		);
		return abi.decode(_value, (uint256));
	}

	function createPolicy(
		address _policyHolder,
		uint256 _coverageAmount,
		uint _age,
		bool _smoker,
		uint _weight
	) public whenLifeInsuranceIsReady {
		uint256 premium = calculatePremium(
			_coverageAmount,
			_age,
			_smoker,
			_weight
		);

		policies[_policyHolder] = Policy({
			coverageAmount: _coverageAmount,
			monthlyPremium: premium,
			dueDate: block.timestamp + 30 days,
			lateFee: (premium * 3) / 100, // 3% late fee
			endDate: block.timestamp + ((365 days) * 25), // 25 yrs hardcoded
			isActive: true
		});

		policyholders[_policyHolder] = PolicyholderInfo({
			age: _age,
			smoker: _smoker,
			weight: _weight
		});
	}

	function calculatePremium(
		uint256 _covAmount,
		uint _age,
		bool _smoker,
		uint _weight
	) public pure returns (uint256) {
		uint basePremium = _covAmount / 300; // 25 yrs - 12 months a year payments
		// add 10% profit margin
		basePremium = (basePremium * 11) / 10;
		// less than 25 yrs 20% discount, upto 40 yrs no discount, upto 60 yrs 20% more, and after 60 50% more premium
		uint ageFactor = _age < 25 ? 80 : _age < 40 ? 100 : _age < 60
			? 120
			: 150;
		uint smokerFactor = _smoker ? 120 : 100; // smoker pays 20% more
		// 1 is lowest fitness and 10 is best fitness.
		// max fitness 10 will get 18% discount.
		uint fitnessFactor = 100 - (_weight - 1) * 2; // Decrease premium for higher fitness

		return
			(basePremium * ageFactor * smokerFactor * fitnessFactor) / 1000000;
	}

	function getCurrentTime() internal view returns (uint256) {
		if (currentTestTime > 0) {
			return currentTestTime; // means we are using test time -
		} else {
			return block.timestamp;
		}
	}
	function setCurrentTime(uint256 _currentTime) public {
		currentTestTime = _currentTime;
	}
	function setDeathValue(uint256 _deathInfo) public {
		deathTestValue = _deathInfo;
	}

	function payPremium(
		address _policyHolder
	) public payable whenLifeInsuranceIsReady {
		Policy storage policy = policies[_policyHolder];
		require(policy.isActive, "Policy is not active");

		// Calculate the number of full 30-day periods that have passed since the due date
		uint256 periodsLate = 0;
		// later need to change getCurrentTime() to block.timestamp
		if (getCurrentTime() > policy.dueDate) {
			periodsLate = (getCurrentTime() - policy.dueDate) / 30 days;
		} 
		// uint256 periodsLate = (getCurrentTime() - policy.dueDate) / 30 days;
		uint256 totalDue = 0;
		if (periodsLate > 0) {
			totalDue = periodsLate *
				(policy.monthlyPremium + policy.lateFee);
		// Require that the payment covers the total due (including all missed premiums and late fees)
		} else {
			totalDue = policy.monthlyPremium;  // no late fee
		}
		require(
			msg.value >= totalDue,
			"Incorrect premium amount including late fees"
		);

		// uint256 periodsLate = 0;
		// uint256 totalDue = policy.monthlyPremium;

		// Calculate commissions based on the total payment
		uint256 commission = (totalDue * COMMISSION_RATE) / 100;
		
		commissionCollectedTotal = commissionCollectedTotal + commission;

		// Adjust the due date: advance by the number of missed periods plus one for the current payment
		policy.dueDate += (periodsLate + 1) * 30 days;

		// Any excess payment can be considered as pre-payment or returned to the policyholder (optional)
		if (msg.value > totalDue) {
			uint256 excess = msg.value - totalDue;
			payable(_policyHolder).transfer(excess); // Refund the excess or handle differently
		}
	}

	

	function claim() public whenLifeInsuranceIsReady {
		Policy storage policy = policies[msg.sender];
		require(policy.isActive, "Policy is not active");
		// Additional claim logic here
		// call oracle here - for now btc spot price
		uint maxTime = 360 * 60 * 24 * 90;
		uint oracleResult = (getBtcSpotPrice(maxTime)) % 2; // for now randomize it
		emit OracleResult(oracleResult);  // Emit the event logging the oracle result
		if (deathTestValue > 0) {
			// test purpose
			oracleResult = 1;
		}
		require(oracleResult > 0, "Can claim only if died");
		// now pay their coverage amount
		require((address(this).balance >= (policy.coverageAmount + commissionCollectedTotal)  ), "not enough to claim");
		payable(msg.sender).transfer(policy.coverageAmount);
		policy.isActive = false; // set it to false now
	
	}

	// function claimCommission() public whenLifeInsuranceIsReady {
	// you can always claim commission if commissions exist
	function claimCommission() public  {
		// uint256 amount = pendingWithdrawals[msg.sender];
		// require(amount > 0, "No commission to withdraw");
		// pendingWithdrawals[msg.sender] = 0;
		// payable(msg.sender).transfer(amount);

		uint256 myCommisionEntitled = commissionCollectedTotal * investorTokenBalance[msg.sender] /  totalTokens;
		uint256 myCollectedCommision = commissionCollected[msg.sender];

		if ((myCommisionEntitled - myCollectedCommision) > 0 ) {
			uint256 myRemainingToCollect = myCommisionEntitled - myCollectedCommision;
			commissionCollected[msg.sender] = commissionCollected[msg.sender] + myRemainingToCollect;
			payable(msg.sender).transfer(myRemainingToCollect);
		}
	}

	function terminatePolicy() public whenLifeInsuranceIsReady {
		policies[msg.sender].isActive = false;
	}

	/// @notice Gives tokens based on the amount of ETH sent
	/// @dev This implementation is prone to rounding problems
	function purchaseTokens() external payable {
		require(msg.value > 0, "Must send ETH to purchase tokens");
		uint256 balanceBefore = 0;
		if (address(this).balance > 0) {
			balanceBefore = address(this).balance - msg.value;
			require(
				balanceBefore < THRESHOLD,
				"once threshold is reached no more investors can add ETH"
			);
		}

		// // Calculate the new balance after adding the current transaction's value
		// uint256 newBalance = address(this).balance + msg.value;

		// Calculate the number of tokens to mint
		uint256 tokensToMint = msg.value * purchaseRatio;

		// Proceed to mint tokens if under threshold or exactly reaching the threshold
		paymentToken.mint(msg.sender, tokensToMint);

		// Update the investor's token balance in the mapping -- for now we are not worrying of them trnasferring to another wallet address
		investorTokenBalance[msg.sender] += tokensToMint;
		totalTokens = totalTokens + tokensToMint;    // track total investments
	}

	/// @notice Returns a random number calculated from the previous block randao
	/// @dev This only works after The Merge
	function getRandomNumber() public view returns (uint256 randomNumber) {
		randomNumber = block.prevrandao;
	}

	/// @notice Burns `amount` tokens and give the equivalent ETH back to user
	function returnTokens(uint256 amount) external {
		paymentToken.burnFrom(msg.sender, amount);
		payable(msg.sender).transfer(amount / purchaseRatio);
	}
}

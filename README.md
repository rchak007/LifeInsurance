

# Life Insurance Smart Contract



![image-20240430202649667](./Images/image-20240430202649667.png)





This Ethereum smart contract, created by Group 1 of the Encode bootcamp, is designed for a life insurance platform. It leverages the OpenZeppelin library for ERC20 token functionality and integrates with the UsingTellor oracle to fetch external data.

**Key Features:**

- **Token-Based Payments**: The contract uses a custom ERC20 token, `LifeInsuranceToken`, for handling initial seed investment and then commission payments for the investors. Users pay premiums in ETH.
- **Policy Management**: Users can create life insurance policies specifying coverage amount, and personal health data. Premiums are due monthly, with a late fee applied for overdue payments.
- **Commission System**: The contract collects a 1% commission on transactions, which is stored and can be claimed by investors based on their token holdings.
- **Oracle Integration**: Uses the Tellor oracle for external data, primarily to validate claims through external conditions (e.g., BTC spot price as a placeholder for test scenarios). But later will be converted to actual Death info as Oracles from valid government data reporting.
- **Claim Processing**: Policyholders can claim their coverage amount upon meeting certain conditions verified through the oracle. The contract ensures funds are available and adjusts policy status accordingly.
- **Investment Opportunity**: Allows users to invest in the insurance pool by purchasing tokens. It includes functionality to handle investments, token minting, and returns.
- **Testing and Time Management**: Includes mechanisms to manipulate and test time-dependent features such as monthly payments and trigger death info so claims can be paid for testing.

**Security and Usability Features:**

- **Policy Termination**: Policyholders may terminate their policies at any time.
- **Token Purchase and Return**: Participants can buy insurance tokens with ETH and return tokens to reclaim ETH, subject to contract thresholds and conditions.



The contract is robust, with modular features for scalability and updates, aiming to provide a reliable and user-friendly platform for life insurance management on the blockchain.








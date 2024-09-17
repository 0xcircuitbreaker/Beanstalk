// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;
pragma abicoder v2;

import {TestHelper, LibTransfer, C, IMockFBeanstalk} from "test/foundry/utils/TestHelper.sol";
import {L1RecieverFacet} from "contracts/beanstalk/migration/L1RecieverFacet.sol";
import {Order} from "contracts/beanstalk/market/MarketplaceFacet/Order.sol";
import {LibBytes} from "contracts/Libraries/LibBytes.sol";
import "forge-std/console.sol";

/**
 * @notice Tests the functionality of the L1RecieverFacet.
 */

interface IERC1555 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract L1RecieverFacetTest is Order, TestHelper {
    // Offset arbitrum uses for corresponding L2 address
    uint160 internal constant OFFSET = uint160(0x1111000000000000000000000000000000001111);

    address constant L2BEAN = address(0xBEA0005B8599265D41256905A9B3073D397812E4);
    address constant L2URBEAN = address(0x1BEA054dddBca12889e07B3E076f511Bf1d27543);
    address constant L2URLP = address(0x1BEA059c3Ea15F6C10be1c53d70C75fD1266D788);

    // contracts for testing:
    // note this is the first address numerically sorted in the merkle tree
    address constant OWNER = address(0x153072C11d6Dffc0f1e5489bC7C996c219668c67);
    address RECIEVER;

    function setUp() public {
        initializeBeanstalkTestState(true, false);

        RECIEVER = applyL1ToL2Alias(OWNER);
        console.log("RECIEVER:", RECIEVER);

        // setup basic whitelisting for testing
        bs.mockWhitelistToken(L2BEAN, IMockFBeanstalk.beanToBDV.selector, 10000000000, 1);
        bs.mockWhitelistToken(L2URBEAN, IMockFBeanstalk.unripeBeanToBDV.selector, 10000000000, 1);
        bs.mockWhitelistToken(L2URLP, IMockFBeanstalk.unripeLPToBDV.selector, 10000000000, 1);

        // set the milestone stem for BEAN
        bs.mockSetMilestoneStem(L2BEAN, 36462179909);
        bs.mockSetMilestoneSeason(L2BEAN, bs.season());
        bs.mockSetMilestoneStem(L2URBEAN, 0);
        bs.mockSetMilestoneSeason(L2URBEAN, bs.season());
        bs.mockSetMilestoneStem(L2URLP, 0);
        bs.mockSetMilestoneSeason(L2URLP, bs.season());
    }

    /**
     * @notice validates that an account verification works, with the correct data.
     */
    function test_L2MigrateDeposits() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            uint256[] memory depositIds,
            uint256[] memory depositAmounts,
            uint256[] memory bdvs,
            bytes32[] memory proof
        ) = getMockDepositData();

        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueDeposits(owner, depositIds, depositAmounts, bdvs, proof);

        console.log("done issuing deposits");

        assertEq(bs.balanceOfStalk(RECIEVER), 9278633023225688000000);
        console.log("done checking balance of stalk");
        (address token, int96 stem) = LibBytes.unpackAddressAndStem(depositIds[0]);
        (uint256 amount, uint256 bdv) = bs.getDeposit(RECIEVER, token, stem);
        assertEq(amount, depositAmounts[0]);
        assertEq(bdv, bdvs[0]);

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Deposits have been migrated");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueDeposits(owner, depositIds, depositAmounts, bdvs, proof);
    }

    function test_L2MigratePlots() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            uint256[] memory index,
            uint256[] memory pods,
            bytes32[] memory proof
        ) = getMockPlot();

        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePlots(owner, index, pods, proof);
        uint256 amt = bs.plot(RECIEVER, 0, index[0]);
        assertEq(amt, pods[0]);

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Plots have been migrated");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePlots(owner, index, pods, proof);
    }

    function test_L2MigrateInternalBalances() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            address[] memory tokens,
            uint256[] memory amounts,
            bytes32[] memory proof
        ) = getMockInternalBalance();

        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueInternalBalances(owner, tokens, amounts, proof);
        uint256 amount = bs.getInternalBalance(RECIEVER, tokens[0]);
        assertEq(amount, amounts[0]);
        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Internal Balances have been migrated");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueInternalBalances(owner, tokens, amounts, proof);
    }

    function test_L2MigrateFert() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            uint256[] memory ids,
            uint128[] memory amounts,
            uint128 lastBpf,
            bytes32[] memory proof
        ) = getMockFertilizer();

        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueFertilizer(owner, ids, amounts, lastBpf, proof);

        assertEq(IERC1555(fertilizerAddress).balanceOf(RECIEVER, ids[0]), amounts[0]);

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Fertilizer have been migrated");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueFertilizer(owner, ids, amounts, lastBpf, proof);
    }

    /*
    // commented out because no pod orders owned by contracts
    function test_L2MigratePodOrder() public {
        bs.setRecieverForL1Migration(address(0x000000009d3a9e5C7C620514E1F36905c4eb91e4), RECIEVER);

        (
            address owner,
            L1RecieverFacet.L1PodOrder[] memory podOrders,
            bytes32[] memory proof
        ) = getMockPodOrder();

        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePodOrders(
            address(0x000000009d3a9e5C7C620514E1F36905c4eb91e4),
            podOrders,
            proof
        );

        // update pod order with reciever to verify id:
        podOrders[0].podOrder.orderer = RECIEVER;

        bytes32 id = _getOrderId(podOrders[0].podOrder);

        assertEq(bs.getPodOrder(id), podOrders[0].beanAmount);

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Orders have been migrated");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePodOrders(owner, podOrders, proof);
    }*/

    /**
     * @notice verifies only the owner or bridge can call the migration functions.
     */
    function test_L2MigrateInvalidReciever(address reciever) public {
        vm.prank(reciever);
        vm.expectRevert("L1RecieverFacet: Invalid Caller");
        bs.approveReciever(OWNER, reciever);

        uint256 snapshot = vm.snapshot();
        address aliasedAddress = applyL1ToL2Alias(BEANSTALK);
        vm.prank(aliasedAddress);
        bs.approveReciever(OWNER, reciever);
        assertEq(bs.getReciever(OWNER), reciever);

        vm.revertTo(snapshot);
        vm.prank(users[0]);
        bs.approveReciever(OWNER, reciever);
        assertEq(bs.getReciever(OWNER), reciever);
    }

    /**
     * @notice verifies that a user cannot gain an invalid plot.
     */
    function test_L2MigrateInvalidPlot() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            uint256[] memory index,
            uint256[] memory pods,
            bytes32[] memory proof
        ) = getMockPlot();

        pods[0] = type(uint256).max;

        vm.expectRevert("L2Migration: Invalid plots");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePlots(owner, index, pods, proof);
    }

    function test_L2MigrateInvalidInternalBalance() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            address[] memory tokens,
            uint256[] memory amounts,
            bytes32[] memory proof
        ) = getMockInternalBalance();

        amounts[0] = type(uint256).max;

        vm.expectRevert("L2Migration: Invalid internal balances");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueInternalBalances(owner, tokens, amounts, proof);
    }

    function test_L2MigrateInvalidFert() public {
        bs.setRecieverForL1Migration(OWNER, RECIEVER);

        (
            address owner,
            uint256[] memory ids,
            uint128[] memory amounts,
            uint128 lastBpf,
            bytes32[] memory proof
        ) = getMockFertilizer();

        amounts[0] = type(uint128).max;

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Invalid Fertilizer");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issueFertilizer(owner, ids, amounts, lastBpf, proof);
    }

    /*
    // commented out because no pod orders owned by contracts
    function test_L2MigrateInvalidPodOrder() public {
        (
            address owner,
            L1RecieverFacet.L1PodOrder[] memory podOrders,
            bytes32[] memory proof
        ) = getMockPodOrder();
        bs.setRecieverForL1Migration(owner, RECIEVER);

        // update pod orderer
        podOrders[0].podOrder.orderer = RECIEVER;

        // verify user cannot migrate afterwords.
        vm.expectRevert("L2Migration: Invalid Order");
        vm.prank(RECIEVER);
        L1RecieverFacet(BEANSTALK).issuePodOrders(owner, podOrders, proof);
    }*/

    // test helpers
    function getMockDepositData()
        internal
        pure
        returns (address, uint256[] memory, uint256[] memory, uint256[] memory, bytes32[] memory)
    {
        address account = address(0x153072C11d6Dffc0f1e5489bC7C996c219668c67);
        uint256[] memory depositIds = new uint256[](4);
        depositIds[0] = uint256(0x1bea054dddbca12889e07b3e076f511bf1d27543000000000000000000000000);
        depositIds[1] = uint256(0x1bea054dddbca12889e07b3e076f511bf1d27543fffffffffffffffc361cfc00);
        depositIds[2] = uint256(0x1bea054dddbca12889e07b3e076f511bf1d27543fffffffffffffffa3cc8f880);
        depositIds[3] = uint256(0xbea0005b8599265d41256905a9b3073d397812e400000000000000087d50b645);

        uint256[] memory amounts = new uint256[](4);
        amounts[0] = 2;
        amounts[1] = 98145025335;
        amounts[2] = 1112719230995;
        amounts[3] = 7199435606;

        uint256[] memory bdvs = new uint256[](4);
        bdvs[0] = 0;
        bdvs[1] = 21907521429;
        bdvs[2] = 248376525588;
        bdvs[3] = 7199435606;

        bytes32[] memory proof = new bytes32[](4);
        proof[0] = bytes32(0x5ef83f1a8578311c39534b42bee1dfeb3615286ea8d88cb8d1049815df6cc280);
        proof[1] = bytes32(0x707b589c0c392e07b09601c0c055bf263f597daa15a69b2a8081d05430997682);
        proof[2] = bytes32(0x9e6eb9e0280de48adad93234edbb18284e135a06d7371391a14eed417d833523);
        proof[3] = bytes32(0x15c9ecf466aefd85d1ced579df7a8fb0219af3d27d3255e808226bbd9e219303);

        return (account, depositIds, amounts, bdvs, proof);
    }

    function getMockPlot()
        internal
        returns (address, uint256[] memory, uint256[] memory, bytes32[] memory)
    {
        address account = address(0x000000009d3a9e5C7c620514e1f36905C4Eb91e1);

        uint256[] memory index = new uint256[](1);
        index[0] = 1000000;

        uint256[] memory pods = new uint256[](1);
        pods[0] = 1000000;

        bytes32[] memory proof = new bytes32[](3);
        proof[0] = bytes32(0x7fec66e420aacd9e183eccd924035325e315d9013f6f3d451bb9e858dffe90ec);
        proof[1] = bytes32(0x5dea8270f7662bd619252f3e42834dceb9f5705b6519d3eeb3739eae266b82f4);
        proof[2] = bytes32(0xc9661717e025decd79ae2e6f247415a52ff577c22bb4479239696b4d7fe0113f);

        return (account, index, pods, proof);
    }

    function getMockInternalBalance()
        internal
        returns (address, address[] memory, uint256[] memory, bytes32[] memory)
    {
        address account = address(0x000000009d3a9e5C7c620514e1f36905C4Eb91e1);

        address[] memory tokens = new address[](1);
        tokens[0] = address(0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab);

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000000;

        bytes32[] memory proof = new bytes32[](3);
        proof[0] = bytes32(0x6a57990edf1b67a414df7d4aec7b52e1c47286a03509d9c6f15a16b756a5de66);
        proof[1] = bytes32(0x71d925b5e0154ae1869b233f58af5d6e9dbaa13be37c15c96e7a2349c7022ca6);
        proof[2] = bytes32(0xafd548122a5e2e140737734c83cafd8d7299227d41232014a13e8454719fa366);

        return (account, tokens, amounts, proof);
    }

    function getMockFertilizer()
        internal
        returns (address, uint256[] memory, uint128[] memory, uint128, bytes32[] memory)
    {
        address account = address(0x000000009d3a9e5C7c620514e1f36905C4Eb91e1);

        uint256[] memory ids = new uint256[](1);
        ids[0] = 1000000;

        uint128[] memory amounts = new uint128[](1);
        amounts[0] = 1000000;

        uint128 lastBpf = 1000000000000;

        bytes32[] memory proof = new bytes32[](3);
        proof[0] = bytes32(0xd19d28ef2a071aa639c9393027a37d79d5fe98d72e92e3503e15919f197d2d85);
        proof[1] = bytes32(0xb2de5943ed868a3e93502a344d36169678c761d3cc408a7b5b264c6fe9b3a4e9);
        proof[2] = bytes32(0x0a2ec57dfd306a0e6b245cde079298f849cda3a3ba90016fa3216aac66a9ede3);

        return (account, ids, amounts, lastBpf, proof);
    }

    function getMockPodOrder()
        internal
        returns (address, L1RecieverFacet.L1PodOrder[] memory, bytes32[] memory)
    {
        address account = address(0x000000009d3a9e5C7C620514E1F36905c4eb91e4);

        L1RecieverFacet.L1PodOrder[] memory podOrders = new L1RecieverFacet.L1PodOrder[](1);
        podOrders[0] = L1RecieverFacet.L1PodOrder(
            Order.PodOrder(account, 1, 100000, 1000000000000, 1000000),
            1000000
        );

        bytes32[] memory proof = new bytes32[](3);
        proof[0] = bytes32(0x9887e2354e3cdb5d01aff524d71607cfdf3c4293c6f5711c806277fee5ad2063);
        proof[1] = bytes32(0xe7d5a9eada9ddd23ca981cb62c1c0668339becddfdd69c463ae63ee3ebbdf50f);
        proof[2] = bytes32(0x9dc791f184484213529aa44fad0074c356eb252777a3c9b0516efaf0fd740650);

        return (account, podOrders, proof);
    }

    /**
     * @notice Utility function that converts the address in the L1 that submitted a tx to
     * the inbox to the msg.sender viewed in the L2
     * @param l1Address the address in the L1 that triggered the tx to L2
     * @return l2Address L2 address as viewed in msg.sender
     */
    function applyL1ToL2Alias(address l1Address) internal pure returns (address l2Address) {
        unchecked {
            l2Address = address(
                uint160(l1Address) + uint160(0x1111000000000000000000000000000000001111)
            );
        }
    }
}

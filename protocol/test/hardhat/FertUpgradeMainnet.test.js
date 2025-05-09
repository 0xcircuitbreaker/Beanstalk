const { bipMiscellaneousImprovements } = require("../../scripts/bips.js");
const { BEANSTALK, FERTILIZER } = require("./utils/constants.js");
const { assert } = require("chai");
const { takeSnapshot, revertToSnapshot } = require("./utils/snapshot.js");

// The test can be skipped, given that the miscellaneous bip improvements has already been deployed.
describe.skip("Fert Upgrade with on-chain metadata", function () {
  before(async function () {
    try {
      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: process.env.FORKING_RPC,
              blockNumber: 20333299 //a random semi-recent block after the seed gauge was deployed
            }
          }
        ]
      });
    } catch (error) {
      console.log("forking error in FertUpgrade");
      console.log(error);
      return;
    }
    // fert contract
    this.fert = await ethers.getContractAt("Fertilizer", FERTILIZER);
    // check for old uri
    const nextFertid = await this.fert.getMintId();
    const uri = await this.fert.uri(nextFertid);
    assert.equal(uri, "https://fert.bean.money/1540802");
    await bipMiscellaneousImprovements();
  });

  it("gets the new fert uri", async function () {
    this.fert = await ethers.getContractAt("Fertilizer", FERTILIZER);
    const nextFertid = await this.fert.getMintId();
    const uri = await this.fert.uri(nextFertid);
    const onChainUri =
      "data:application/json;base64,eyJuYW1lIjogIkZlcnRpbGl6ZXIgLSAxNTQwODAyIiwgImV4dGVybmFsX3VybCI6ICJodHRwczovL2ZlcnQuYmVhbi5tb25leS8xNTQwODAyLmh0bWwiLCAiZGVzY3JpcHRpb24iOiAiQSB0cnVzdHkgY29uc3RpdHVlbnQgb2YgYW55IEZhcm1lcnMgdG9vbGJveCwgRVJDLTExNTUgRkVSVCBoYXMgYmVlbiBrbm93biB0byBzcHVyIG5ldyBncm93dGggb24gc2VlbWluZ2x5IGRlYWQgZmFybXMuIE9uY2UgcHVyY2hhc2VkIGFuZCBkZXBsb3llZCBpbnRvIGZlcnRpbGUgZ3JvdW5kIGJ5IEZhcm1lcnMsIEZlcnRpbGl6ZXIgZ2VuZXJhdGVzIG5ldyBTcHJvdXRzOiBmdXR1cmUgQmVhbnMgeWV0IHRvIGJlIHJlcGFpZCBieSBCZWFuc3RhbGsgaW4gZXhjaGFuZ2UgZm9yIGRvaW5nIHRoZSB3b3JrIG9mIFJlcGxhbnRpbmcgdGhlIHByb3RvY29sLiIsICJpbWFnZSI6ICJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBITjJaeUIzYVdSMGFEMGlNamswSWlCb1pXbG5hSFE5SWpVeE1pSWdkbWxsZDBKdmVEMGlNQ0F3SURJNU5DQTFNVElpSUdacGJHdzlJbTV2Ym1VaUlIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJZ2VHMXNibk02ZUd4cGJtczlJbWgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5MekU1T1RrdmVHeHBibXNpUGp4d1lYUm9JR1E5SWsweE5qUXVORGNnTXpJM0xqSTBNU0F5T0M0Mk1qVWdOREExTGpjMk9Hd3RMamczT0MweU1qRXVOVFV4SURFek5TNDRORGt0TnpndU5UVTVMamczTkNBeU1qRXVOVGd6V2lJZ1ptbHNiRDBpSXpORVFVRTBOeUl2UGp4d1lYUm9JR1E5SW0weE1UZ3VNRFU1SURNMU5DNHdOemN0TkRFdU1UQXlJREl6TGpjME5pMHVPRGMwTFRJeU1TNDFOVEVnTkRFdU1UQXhMVEl6TGpjM09DNDROelVnTWpJeExqVTRNMW9pSUdacGJHdzlJaU16UkVGQk5EY2lMejQ4Y0dGMGFDQmtQU0p0TWpZdU9ESTFJREU0TkM0eU5ESXVPRGNnTWpJeExqVTJOeUE1TXk0ek5qY2dOVFF1TXpNNUxTNDROekV0TWpJeExqVTJOQzA1TXk0ek5qWXROVFF1TXpReVdtMHhNell1TkRNeUxUYzRMakkyTWk0NE56RWdNakl4TGpVMk9DQTVNeTR6TmpjZ05UUXVNek00TFM0NE56RXRNakl4TGpVMk5DMDVNeTR6TmpjdE5UUXVNelF5V2lJZ1ptbHNiRDBpSXpORVFqVTBNaUl2UGp4d1lYUm9JR1E5SWswM05pNDJNelFnTVRZeUxqa3hOU0F5TVRJZ09EUXVNVE16YkRRMExqQXpOQ0EzTlM0NU1Ea3RNVE0xTGpnME1pQTNPQzQxTkRRdE5ETXVOVFUzTFRjMUxqWTNNVm9pSUdacGJHdzlJaU00TVVRMk56SWlMejQ4Y0dGMGFDQmtQU0p0TVRJMExqazJOaUF4TXpRdU9UY2dOREF1TmpJMExUSTBMakF3TVNBME5DNHdNekVnTnpVdU9UQTJMVFF4TGpBNU9DQXlNeTQzTmpVdE5ETXVOVFUzTFRjMUxqWTNXaUlnWm1sc2JEMGlJelEyUWprMU5TSXZQanh3WVhSb0lHUTlJbTB5TVRJdU1USTFJRFEzTGpreE9DMHVNVEUySURNMkxqSXlPQzB4TXpVdU16azBJRGM0TGpjMk5pNHhNVFl0TXpZdU1UZGpNQzB5TGpBek1pMHhMak01TFRRdU5ERXpMVE11TVRNdE5TNDBOVGN0TGpnM0xTNDFNak10TVM0Mk9DMHVOVEl6TFRJdU1qWXhMUzR5TXpOc01UTTFMak01TkMwM09DNDNOalpqTGpVNExTNHpORGtnTVM0ek16SXRMakk1SURJdU1qQXpMakl6TXlBeExqY3pOaTQ1T0RrZ015NHhPRGdnTXk0ME1qVWdNeTR4T0RnZ05TNDBXaUlnWm1sc2JEMGlJelpFUTBJMk1DSXZQanh3WVhSb0lHUTlJbTB4TmpVdU56RXpJRGMwTGpjMU1pMHVNVEUySURNMkxqSXlPQzAwTUM0Mk5TQXlNeTQ1T0RndU1URTJMVE0yTGpFM1l6QXRNaTR3TXpJdE1TNHpPUzAwTGpReE15MHpMakV5T1MwMUxqUTFOeTB1T0RjeUxTNDFNak10TVM0Mk9ERXRMalV5TXkweUxqSTJNaTB1TWpNeWJEUXdMalkxTFRJekxqazRPV011TlRndExqTTBPU0F4TGpNek1pMHVNamtnTWk0eU1ETXVNak16SURFdU56TTVMams0TmlBekxqRTRPQ0F6TGpReU5TQXpMakU0T0NBMUxqUmFJaUJtYVd4c1BTSWpOREpCT0RSRElpOCtQSEJoZEdnZ1pEMGlUVGN6TGpVM09TQXhNakV1TWprNFl6RXVOek01SURFdU1EQTFJRE11TVRZeUlETXVOREl5SURNdU1UVTVJRFV1TkRJMWJDMHVNVEEwSURNMkxqRTVNeUEwTXk0MU5UY2dOelV1TmpZM0xUa3pMak0yTmkwMU5DNHpNemtnTkRNdU5USXhMVEkxTGpBeE9DNHhNRE10TXpZdU1UUXhZeTR3TURRdE1pQXhMak01TFRJdU56azFJRE11TVRNdE1TNDNPRGRhSWlCbWFXeHNQU0lqTWtNNVFUSkRJaTgrUEhCaGRHZ2daRDBpVFRFd055NDROemtnTWpJMkxqYzJOaUF6Tmk0Mk1pQXhPRFV1TlRZMWJETTFMamMwTWkweU1DNHpPVFVnTVRFdU5ESTRJREU1TGpjNU5DQXlOQzR3T0RrZ05ERXVPREF5V2lJZ1ptbHNiRDBpSXpaRVEwSTJNQ0l2UGp4d1lYUm9JR1E5SW0wNE1TNHpORGdnTVRnd0xqY3pNUzAwTkM0M01qZ2dOQzQ0TXpRZ016VXVOelF5TFRJd0xqTTVOU0E0TGprNE5pQXhOUzQxTmpGYUlpQm1hV3hzUFNJak9ERkVOamN5SWk4K0lDQThjR0YwYUNCa1BTSk5PVFV1TkRreklESXdPUzR5TXpkakxUa3VORFEzSURJdU9UWTJMVEUzTGpnME5TQXhNQzQyTXpjdE1qRXVOaklnTWpFdU5UVXlMUzQwT1RjZ01TNDFPRGt0TWk0Mk56Z2dNUzQxT0RrdE15NHlOeklnTUMwekxqSTNNaTB4TUM0eU15MHhNUzQwTURVdE1UZ3VNamMyTFRJeExqVXlMVEl4TGpVMU1pMHhMamM0TkMwdU5UazRMVEV1TnpnMExUSXVOemd5SURBdE15NHpOemNnTVRBdU1URTFMVE11TXpFeUlERTRMakUzTkMweE1TNDFNRFlnTWpFdU5USXRNakV1TlRVeUxqVTVOQzB4TGpZNE9TQXlMamMzT0MweExqWTRPU0F6TGpJM01pQXdJRE11TnpZNElERXdMalk0T1NBeE1TNDFOak1nTVRndU1UazFJREl4TGpZeUlESXhMalUxTWlBeExqWTROeTQxT1RVZ01TNDJPRGNnTWk0M056a2dNQ0F6TGpNM04xb2lJR1pwYkd3OUlpTm1abVlpTHo0OGNHRjBhQ0JrUFNKdE1qVTJMamc1T0NBek9ERXVOakE1TFRFek5TNDRORFlnTnpndU5USTNMUzQ0TnpjdE1qSXhMalUxTVNBeE16VXVPRFE1TFRjNExqVTJMamczTkNBeU1qRXVOVGcwV2lJZ1ptbHNiRDBpSXpaRVEwSTJNQ0l2UGp4d1lYUm9JR1E5SW0weU1UQXVORGcySURRd09DNDBORFV0TkRFdU1UQXhJREl6TGpjME5TMHVPRGMxTFRJeU1TNDFOVEVnTkRFdU1UQXlMVEl6TGpjM09DNDROelFnTWpJeExqVTRORm9pSUdacGJHdzlJaU16UkVGQk5EY2lMejQ4Y0dGMGFDQmtQU0p0TWpRd0xqa3dNU0F6TmpRdU9UUTVMVEV3TkM0ME1EY2dOakF1TXpnM0xTNHpNak10TVRVM0xqUTNOeUF4TURRdU5EQTRMVFl3TGpNMU1TNHpNaklnTVRVM0xqUTBNVm9pSUdacGJHdzlJaU5tWm1ZaUx6NDhjR0YwYUNCa1BTSk5NVGsxTGpjNE9TQXlOamd1TURJMVl6SXpMakV6TnkwMkxqY3hOQ0F6Tmk0NE56VWdNVEF1TmpNeElETXlMak13TmlBek5TNHlNek10TkM0d01pQXlNUzQyTlRJdE1qRXVNelV5SURReUxqZzBOUzB6T1M0M05qa2dORGt1T0RJeExURTVMakUzTVNBM0xqSTJMVE0xTGpjeE55MHlMakkyT0Mwek5pNHlPVGN0TWpNdU9UWTJMUzQyTmpVdE1qUXVPVEl5SURFNUxqUXhNeTAxTkM0d01qRWdORE11TnpZdE5qRXVNRGc0V2lJZ1ptbHNiRDBpSXpRMlFqazFOU0l2UGp4d1lYUm9JR1E5SW0weU1EWXVOREUzSURJM05TNDJNVFV0TWpndU1EZ2dOek11TlRjM2N5MHlOQzQxTmprdE16VXVNemszSURJNExqQTRMVGN6TGpVM04xcHRMVEl6TGpBeU55QTJPQzR6TmpJZ01Ua3VOVFl4TFRVd0xqa3hObk15TXk0NE16RWdNVGN1TVRnNUxURTVMalUyTVNBMU1DNDVNVFphSWlCbWFXeHNQU0lqWm1abUlpOCtQSFJsZUhRZ1ptOXVkQzFtWVcxcGJIazlJbk5oYm5NdGMyVnlhV1lpSUdadmJuUXRjMmw2WlQwaU1qQWlJSGc5SWpJd0lpQjVQU0kwT1RBaUlHWnBiR3c5SW1Kc1lXTnJJaUErUEhSemNHRnVJR1I1UFNJd0lpQjRQU0l5TUNJK01TNHlNQ0JDVUVZZ1VtVnRZV2x1YVc1bklEd3ZkSE53WVc0K1BDOTBaWGgwUGp3dmMzWm5QZz09IiwgImF0dHJpYnV0ZXMiOiBbeyAidHJhaXRfdHlwZSI6ICJCUEYgUmVtYWluaW5nIiwiZGlzcGxheV90eXBlIjogImJvb3N0X251bWJlciIsInZhbHVlIjogMS4yMCB9XX0=";
    assert.equal(uri, onChainUri);
  });

  it("keeps the same fert owner", async function () {
    // fert contract
    this.fert = await ethers.getContractAt("Fertilizer", FERTILIZER);
    // fert beanstalk facet
    const owner = await this.fert.owner();
    assert.equal(owner, BEANSTALK);
  });
});

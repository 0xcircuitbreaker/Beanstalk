import { provider } from "../setup";
import { WellsSDK, Well } from "@beanstalk/wells";

const WELL_ADDRESS = "0x3d6E2F365fA27FdafBB20b9356C0C0922224E8d2";

main().catch((e) => {
  console.log("FAILED:");
  console.log(e);
});

async function main() {
  const sdk = new WellsSDK({ provider });

  // get Well object
  const well: Well = await sdk.getWell(WELL_ADDRESS, { name: true });
  await well.loadWell();
  console.log(well);
}

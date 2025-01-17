/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {describe, it, expect, beforeAll} from "vitest";
import {config} from "@lodestar/config/default";
import {getBeaconApi} from "../../../../../src/api/impl/beacon/index.js";
import {setupApiImplTestServer, ApiImplTestModules} from "../../../../__mocks__/apiMocks.js";
import {testLogger} from "../../../../utils/logger.js";
import {MockedBeaconDb} from "../../../../__mocks__/mockedBeaconDb.js";

describe("beacon api implementation", function () {
  const logger = testLogger();
  let dbStub: MockedBeaconDb;
  let server: ApiImplTestModules;

  beforeAll(function () {
    server = setupApiImplTestServer();
    dbStub = new MockedBeaconDb();
  });

  describe("getGenesis", function () {
    it("success", async function () {
      const api = getBeaconApi({
        config,
        chain: server.chainStub,
        db: dbStub,
        logger,
        network: server.networkStub,
        metrics: null,
      });

      /** eslint-disable @typescript-eslint/no-unsafe-member-access */
      (server.chainStub as any).genesisTime = 0;
      (server.chainStub as any).genesisValidatorsRoot = Buffer.alloc(32);
      const {data: genesis} = await api.getGenesis();
      if (genesis === null || genesis === undefined) throw Error("Genesis is nullish");
      expect(genesis.genesisForkVersion).toBeDefined();
      expect(genesis.genesisTime).toBeDefined();
      expect(genesis.genesisValidatorsRoot).toBeDefined();
    });
  });
});

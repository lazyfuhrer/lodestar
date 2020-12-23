import pipe from "it-pipe";
import all from "it-all";
import {
  eth2RequestDecode,
  eth2RequestEncode,
  RequestDecodeError,
  RequestDecodeErrorCode,
} from "../../../../src/network/encoders/request";
import {config} from "@chainsafe/lodestar-config/minimal";
import {Method, ReqRespEncoding} from "../../../../src/constants";
import {ILogger, WinstonLogger} from "@chainsafe/lodestar-utils";
import sinon, {SinonStubbedInstance} from "sinon";
import {expect} from "chai";
import {createStatus} from "./utils";
import {encode} from "varint";
import {Status} from "@chainsafe/lodestar-types";
import {silentLogger} from "../../../utils/logger";

describe("request encoders", function () {
  const logger = silentLogger;
  let loggerStub: SinonStubbedInstance<ILogger>;

  beforeEach(function () {
    loggerStub = sinon.createStubInstance(WinstonLogger);
  });

  it("should work - basic request - ssz", async function () {
    const requests = await pipe(
      [BigInt(0)],
      eth2RequestEncode(config, logger, Method.Ping, ReqRespEncoding.SSZ),
      eth2RequestDecode(config, logger, Method.Ping, ReqRespEncoding.SSZ),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Uint64.equals(requests[0].body as bigint, BigInt(0))).to.be.true;
  });

  it("should work - basic request - ssz_snappy", async function () {
    const requests = await pipe(
      [BigInt(0)],
      eth2RequestEncode(config, logger, Method.Ping, ReqRespEncoding.SSZ_SNAPPY),
      eth2RequestDecode(config, logger, Method.Ping, ReqRespEncoding.SSZ_SNAPPY),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Uint64.equals(requests[0].body as bigint, BigInt(0))).to.be.true;
  });

  it("should work - container request - ssz", async function () {
    const status = createStatus();
    const requests = await pipe(
      [status],
      eth2RequestEncode(config, logger, Method.Status, ReqRespEncoding.SSZ),
      eth2RequestDecode(config, logger, Method.Status, ReqRespEncoding.SSZ),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Status.equals(requests[0].body as Status, status)).to.be.true;
  });

  it("should work - container request - ssz", async function () {
    const status = createStatus();
    const requests = await pipe(
      [status],
      eth2RequestEncode(config, logger, Method.Status, ReqRespEncoding.SSZ_SNAPPY),
      eth2RequestDecode(config, logger, Method.Status, ReqRespEncoding.SSZ_SNAPPY),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Status.equals(requests[0].body as Status, status)).to.be.true;
  });

  it("should work - multiple request - ssz", async function () {
    const requests = await pipe(
      [BigInt(1), BigInt(2)],
      eth2RequestEncode(config, logger, Method.Ping, ReqRespEncoding.SSZ),
      eth2RequestDecode(config, logger, Method.Ping, ReqRespEncoding.SSZ),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Uint64.equals(requests[0].body as bigint, BigInt(1))).to.be.true;
  });

  it("should work - multiple request - ssz_snappy", async function () {
    const requests = await pipe(
      [BigInt(1), BigInt(2)],
      eth2RequestEncode(config, logger, Method.Ping, ReqRespEncoding.SSZ_SNAPPY),
      eth2RequestDecode(config, logger, Method.Ping, ReqRespEncoding.SSZ_SNAPPY),
      all
    );

    expect(requests.length).to.be.equal(1);
    expect(config.types.Uint64.equals(requests[0].body as bigint, BigInt(1))).to.be.true;
  });

  it("should work - no request body - ssz", async function () {
    const requests = await pipe([], eth2RequestDecode(config, logger, Method.Metadata, ReqRespEncoding.SSZ), all);
    expect(requests.length).to.be.equal(1);
  });

  it("should work - no request body - ssz_snappy", async function () {
    const requests = await pipe(
      [],
      eth2RequestDecode(config, logger, Method.Metadata, ReqRespEncoding.SSZ_SNAPPY),
      all
    );
    expect(requests.length).to.be.equal(1);
  });

  it("should warn user if failed to encode request", async function () {
    await pipe(
      [BigInt(1)],
      eth2RequestEncode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ),
      eth2RequestDecode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ),
      all
    );

    expect(loggerStub.warn.calledOnce).to.be.true;
  });

  describe("eth2RequestDecode - request validation", () => {
    it("should yield {isValid: false} if it takes more than 10 bytes for varint", async function () {
      const validatedRequestBody = await pipe(
        [Buffer.from(encode(99999999999999999999999))],
        eth2RequestDecode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ_SNAPPY),
        all
      );

      expect(validatedRequestBody).to.be.deep.equal([{isValid: false}]);
      assertLoggerError(RequestDecodeErrorCode.INVALID_VARINT_BYTES_COUNT);
    });

    it("should yield {isValid: false} if failed ssz size bound validation", async function () {
      const validatedRequestBody = await pipe(
        [Buffer.alloc(12, 0)],
        eth2RequestDecode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ_SNAPPY),
        all
      );

      expect(validatedRequestBody).to.be.deep.equal([{isValid: false}]);
      assertLoggerError(RequestDecodeErrorCode.UNDER_SSZ_MIN_SIZE);
    });

    it("should yield {isValid: false} if it read more than maxEncodedLen", async function () {
      const validatedRequestBody = await pipe(
        [Buffer.from(encode(config.types.Status.minSize())), Buffer.alloc(config.types.Status.minSize() + 10)],
        eth2RequestDecode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ),
        all
      );

      expect(validatedRequestBody).to.be.deep.equal([{isValid: false}]);
      assertLoggerError(RequestDecodeErrorCode.TOO_MUCH_BYTES_READ);
    });

    it("should yield {isValid: false} if failed ssz snappy input malformed", async function () {
      const validatedRequestBody = await pipe(
        [Buffer.from(encode(config.types.Status.minSize())), Buffer.from("wrong snappy data")],
        eth2RequestDecode(config, loggerStub, Method.Status, ReqRespEncoding.SSZ_SNAPPY),
        all
      );

      expect(validatedRequestBody).to.be.deep.equal([{isValid: false}]);
      assertLoggerError(RequestDecodeErrorCode.DECOMPRESSOR_ERROR);
    });

    it("should yield correct RequestBody if correct ssz", async function () {
      const status: Status = config.types.Status.defaultValue();
      status.finalizedEpoch = 100;
      const length = Buffer.from(encode(config.types.Status.minSize()));
      const statusSerialized = Buffer.from(config.types.Status.serialize(status));
      const validatedRequestBody = await pipe(
        [length, statusSerialized],
        eth2RequestDecode(config, logger, Method.Status, ReqRespEncoding.SSZ),
        all
      );

      expect(validatedRequestBody).to.be.deep.equal([{isValid: true, body: status}]);
    });

    function assertLoggerError(code: RequestDecodeErrorCode): void {
      const errArg = loggerStub.error.firstCall.args[1];
      if (errArg instanceof RequestDecodeError) {
        expect(errArg.type.code).to.equal(code);
      } else {
        throw Error("loggerStub not called with proper error");
      }
    }
  });
});

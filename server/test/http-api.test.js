import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { _clearJobs } from "../lib/job-store.js";
import { handleRequest } from "../src/http.js";

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : "";
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 1,
        method,
        path,
        headers: body
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {}
      },
      () => {}
    );

    const chunks = [];
    const res = {
      writeHead: () => {},
      end: (data) => {
        resolve({
          status: res.statusCode || 200,
          body: data ? JSON.parse(data) : null
        });
      },
      statusCode: 200
    };
    res.writeHead = (code) => {
      res.statusCode = code;
    };

    handleRequest(req, res).catch(reject);

    if (body) {
      req.emit("data", payload);
    }
    req.emit("end");
  });
}

/** Simpler: call handleRequest with mock req/res */
async function callApi(method, path, body) {
  let statusCode = 200;
  let responseBody = "";

  const req = new http.IncomingMessage();
  req.method = method;
  req.url = path;

  const res = {
    writeHead(code, _headers) {
      statusCode = code;
    },
    end(data) {
      responseBody = data || "";
    }
  };

  if (body) {
    const payload = JSON.stringify(body);
    process.nextTick(() => {
      req.emit("data", payload);
      req.emit("end");
    });
  } else {
    process.nextTick(() => req.emit("end"));
  }

  await handleRequest(req, res);
  return {
    status: statusCode,
    body: responseBody ? JSON.parse(responseBody) : null
  };
}

describe("HTTP API", () => {
  beforeEach(() => _clearJobs());

  it("GET /health returns ok", async () => {
    const res = await callApi("GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.phase, 2);
  });

  it("POST /v1/r1/run stub marathon returns files", async () => {
    const res = await callApi("POST", "/v1/r1/run", {
      target: "蔚来 NIO",
      marathonMode: true,
      stub: true
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.files.some((f) => f.name === "grill_report.md"));
    assert.ok(res.body.files.some((f) => f.name === "research/00_source_hunt.md"));
  });

  it("POST /v1/r1/jobs async stub completes", async () => {
    const created = await callApi("POST", "/v1/r1/jobs", {
      target: "NIO",
      profile: "marathon",
      stub: true
    });
    assert.equal(created.status, 202);
    const jobId = created.body.jobId;

    let done = null;
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 20));
      const poll = await callApi("GET", `/v1/r1/jobs/${jobId}`);
      if (poll.body.status === "done") {
        done = poll.body;
        break;
      }
      if (poll.body.status === "failed") {
        assert.fail(poll.body.error);
      }
    }
    assert.ok(done, "job should complete");
    assert.ok(done.result.files.some((f) => f.name === "B_knife.md"));
  });
});

import { beforeEach, vi } from "vitest";
import { resetEverythingToDefaults } from "../src/initRepository.ts";

vi.mock("../src/services/moderate.service.ts", () => ({
  moderateMessage: vi.fn().mockResolvedValue({ label: "SAFE", categories: [] }),
}));

beforeEach(async () => {
  await resetEverythingToDefaults();
});

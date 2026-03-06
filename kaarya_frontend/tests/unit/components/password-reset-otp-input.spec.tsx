import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordResetOtpInput } from "@/app/(auth)/_components/password-reset-otp-input";

function OtpHarness() {
  const [value, setValue] = useState("");

  return <PasswordResetOtpInput value={value} onChange={setValue} />;
}

describe("PasswordResetOtpInput", () => {
  it("distributes typed digits across slots and ignores non-digits", async () => {
    const user = userEvent.setup();

    render(<OtpHarness />);

    const firstInput = screen.getByLabelText("Verification code digit 1 of 6");
    await user.type(firstInput, "12a3456");

    expect(screen.getByLabelText("Verification code digit 1 of 6")).toHaveValue("1");
    expect(screen.getByLabelText("Verification code digit 2 of 6")).toHaveValue("2");
    expect(screen.getByLabelText("Verification code digit 3 of 6")).toHaveValue("3");
    expect(screen.getByLabelText("Verification code digit 4 of 6")).toHaveValue("4");
    expect(screen.getByLabelText("Verification code digit 5 of 6")).toHaveValue("5");
    expect(screen.getByLabelText("Verification code digit 6 of 6")).toHaveValue("6");
  });

  it("clears current slot on backspace", async () => {
    const user = userEvent.setup();

    render(<OtpHarness />);

    const firstInput = screen.getByLabelText("Verification code digit 1 of 6");
    await user.type(firstInput, "123456");

    const lastInput = screen.getByLabelText("Verification code digit 6 of 6");
    await user.click(lastInput);
    await user.keyboard("{Backspace}");

    expect(lastInput).toHaveValue("");
    expect(screen.getByLabelText("Verification code digit 5 of 6")).toHaveValue("5");
  });
});

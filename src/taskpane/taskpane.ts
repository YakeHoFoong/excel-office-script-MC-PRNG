// SPDX-FileCopyrightText: Copyright (c) Microsoft Corporation. All rights reserved.
// SPDX-License-Identifier: MIT
/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global console, document, Excel, Office */

// The initialize function must be run each time a new page is loaded
Office.onReady(() => {
  document!.getElementById("sideload-msg")!.style!.display = "none";
  document!.getElementById("app-body")!.style!.display = "flex";
  //document!.getElementById("run")!.onclick = run;
  // eslint-disable-next-line no-undef
  //document!.getElementById("loggy")!.innerText = window.navigator.hardwareConcurrency.toString();
});

export async function run() {
  try {
    await Excel.run(async (context) => {
      /**
       * Insert your Excel code here
       */
      const range = context.workbook.getSelectedRange();

      // Read the range address
      range.load("address");

      // Update the fill color
      range.format.fill.color = "yellow";

      await context.sync();
      console.log(`The range address was ${range.address}.`);
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * @param s - The string to be encoded.
 * @returns A string encoding of the parameter, and is a valid HTML ID value.
 */
function encodeStr(s: string): string {
  let result = "P";
  for (const c of s) result += c.codePointAt(0)?.toString(16);
  return result;
}

/**
 * @param address - The address of the cell containing the formula, as a unique ID.
 * @param currentValue - The current value of progress, a whole number between one and maxValue.
 * @param maxValue - The largest value allowed for the progress or currentValue.
 * @param labelText - The label about the progress bar to show on the task pane.
 * @returns A Promise of None. The task pane will be updated.
 */
export async function showProgressInTaskpane(
  address: string,
  currentValue: number,
  maxValue: number,
  labelText: string
) {
  const barsDiv = document.getElementById("progress-bars");
  // the ID refers to a LABEL element with a PROGRESS child, see
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress
  const labelID = encodeStr(address);
  if (barsDiv) {
    const existingLabel = document.getElementById(labelID);
    // if already finished, remove progress
    if (currentValue >= maxValue) {
      if (existingLabel) existingLabel.remove();
      return;
    }
    // put the progress bar inside the label
    const progressBar = existingLabel ? existingLabel.firstElementChild : document.createElement("progress");
    if (!progressBar || progressBar.nodeName !== "PROGRESS")
      throw Error(
        "Task pane is corrupted, missing PROGRESS element as first child inside LABEL element with ID  of " + labelID
      );
    progressBar.setAttribute("max", maxValue.toString());
    progressBar.setAttribute("value", currentValue.toString());

    if (existingLabel) existingLabel.innerText = labelText;
    else {
      const newLabel = document.createElement("label");
      newLabel.setAttribute("id", labelID);
      newLabel.innerText = labelText;
      barsDiv.appendChild(newLabel); // put the label inside the DIV
      newLabel.appendChild(progressBar); // put the progress bar inside the label
    }
  } else throw Error("Task pane is corrupted, missing HTML element DIV of ID 'progress-bars'");
}

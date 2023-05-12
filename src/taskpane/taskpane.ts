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

export async function showMessageInTaskpane(address: string, message: string) {
  const list = document.getElementById("custom-messages");
  if (list) {
    const bullet = document.getElementById(address);
    if (!bullet) {
      const li = document.createElement("li");
      li.setAttribute("id", address);
      //li.appendChild(document.createTextNode("Four"));
      li.innerHTML = message;
      list.appendChild(li);
    } else bullet.innerHTML = message;
    //x.innerText = message;
  } else throw Error("Task pane is corrupted, missing HTML element UL of ID custom-messages");
}

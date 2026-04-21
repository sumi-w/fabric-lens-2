// FabricLens — Settings Script
(function() {
  var keyInput = document.getElementById("api-key");
  var statusEl = document.getElementById("status");

  function showStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (isError ? " error" : "");
    setTimeout(function() { statusEl.textContent = ""; }, 3000);
  }

  // Load existing key
  chrome.storage.local.get("anthropicApiKey", function(data) {
    if (data.anthropicApiKey) {
      keyInput.value = data.anthropicApiKey;
      showStatus("Key loaded from storage.");
    }
  });

  // Save
  document.getElementById("btn-save").addEventListener("click", function() {
    var key = keyInput.value.trim();
    if (!key) {
      showStatus("Please enter an API key.", true);
      return;
    }
    if (!key.startsWith("sk-")) {
      showStatus("Key should start with sk-", true);
      return;
    }
    chrome.storage.local.set({ anthropicApiKey: key }, function() {
      showStatus("Key saved successfully.");
    });
  });

  // Clear
  document.getElementById("btn-clear").addEventListener("click", function() {
    chrome.storage.local.remove("anthropicApiKey", function() {
      keyInput.value = "";
      showStatus("Key cleared.");
    });
  });
})();

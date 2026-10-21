(function () {
  const form = document.getElementById("compare-form");
  const iit1 = document.getElementById("iit1");
  const iit2 = document.getElementById("iit2");
  const branch1 = document.getElementById("branch1");
  const branch2 = document.getElementById("branch2");
  const userQuery = document.getElementById("user_query");
  const submitBtn = document.getElementById("submit-btn");
  const formError = document.getElementById("form-error");
  const loading = document.getElementById("loading");

  const STORAGE_KEY = "branchintel_compare_result";

  function showError(msg) {
    formError.textContent = msg || "";
    formError.hidden = !msg;
  }

  function fillSelect(select, options, placeholder) {
    select.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    select.appendChild(ph);
    options.forEach((o) => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      select.appendChild(opt);
    });
  }

  async function loadOptions() {
    const [colRes, brRes] = await Promise.all([
      fetch("/colleges"),
      fetch("/branches"),
    ]);
    if (!colRes.ok || !brRes.ok) throw new Error("Could not load IIT / branch lists.");
    const colleges = await colRes.json();
    const branches = await brRes.json();
    const iits = colleges.colleges || [];
    const brs = branches.branches || [];
    fillSelect(iit1, iits, "Choose IIT");
    fillSelect(iit2, iits, "Choose IIT");
    fillSelect(branch1, brs, "Choose Branch");
    fillSelect(branch2, brs, "Choose Branch");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const payload = {
      iit1: iit1.value.trim(),
      branch1: branch1.value.trim(),
      iit2: iit2.value.trim(),
      branch2: branch2.value.trim(),
    };
    const q = userQuery.value.trim();
    if (q) payload.user_query = q;

    if (!payload.iit1 || !payload.branch1 || !payload.iit2 || !payload.branch2) {
      showError("Please choose all four options.");
      return;
    }

    submitBtn.disabled = true;
    loading.hidden = false;

    try {
      const res = await fetch("/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Invalid response from server.");
      }
      if (!res.ok) {
        const detail = data.detail;
        let msg =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((x) => x.msg || JSON.stringify(x)).join("; ")
              : detail
                ? JSON.stringify(detail)
                : "";
        throw new Error(msg || data.message || res.statusText || "Request failed.");
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.location.href = "/results";
    } catch (err) {
      showError(err.message || "Something went wrong.");
    } finally {
      submitBtn.disabled = false;
      loading.hidden = true;
    }
  });

  loadOptions().catch((err) => {
    showError(err.message || "Failed to load form.");
  });
})();

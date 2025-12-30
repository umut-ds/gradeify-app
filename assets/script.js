// Constants
const GRADE_OPTIONS = [
  { value: "4.0", label: "A / First" },
  { value: "3.7", label: "A-" },
  { value: "3.3", label: "B+" },
  { value: "3.0", label: "B / 2:1" },
  { value: "2.7", label: "B-" },
  { value: "2.3", label: "C+" },
  { value: "2.0", label: "C / 2:2" },
  { value: "1.7", label: "C-" },
  { value: "1.3", label: "D+" },
  { value: "1.0", label: "D / Third" },
  { value: "0.0", label: "F / Fail" }
];

const SCALE_MAPS = {
  us: { "4.0": 4.0, "3.7": 3.7, "3.3": 3.3, "3.0": 3.0, "2.7": 2.7, "2.3": 2.3, "2.0": 2.0, "1.7": 1.7, "1.3": 1.3, "1.0": 1.0, "0.0": 0.0 },
  uk: { "4.0": 4.0, "3.7": 3.7, "3.3": 3.3, "3.0": 3.0, "2.7": 2.7, "2.3": 2.3, "2.0": 2.0, "1.7": 1.0, "1.3": 0.0, "1.0": 0.0, "0.0": 0.0 },
  ects: { "4.0": 4.0, "3.7": 3.5, "3.3": 3.0, "3.0": 2.5, "2.7": 2.0, "2.3": 1.5, "2.0": 1.0, "1.7": 0.5, "1.3": 0.0, "1.0": 0.0, "0.0": 0.0 }
};

// Utility Functions
function showResult(resultDiv, className, message) {
  if (!resultDiv) return;
  resultDiv.className = `result ${className}`;
  if (typeof message === 'string') {
    resultDiv.textContent = message;
  } else {
    resultDiv.innerHTML = '';
    resultDiv.appendChild(message);
  }
  resultDiv.style.display = "block";

  // Add copy button for success/warning results
  if (className === "success" || className === "warning") {
    const textToCopy = typeof message === 'string' ? message : message.textContent || message.innerText;
    addCopyButton(resultDiv, textToCopy);
  }
}

function addCopyButton(resultDiv, text) {
  // Avoid duplicate buttons
  if (resultDiv.querySelector(".copy-btn")) return;

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy Result";
  copyBtn.className = "secondary copy-btn";
  copyBtn.style.marginTop = "0.75rem";
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => copyBtn.textContent = "Copy Result", 2000);
    } catch (err) {
      copyBtn.textContent = "Copy Failed";
    }
  };
  resultDiv.appendChild(copyBtn);
}

function showLoading(resultDiv) {
  if (!resultDiv) return;
  resultDiv.className = "result loading";
  resultDiv.textContent = "Calculating...";
  resultDiv.style.display = "block";
}

// ============================================
// FINAL GRADE CALCULATOR
// ============================================
function calculateFinal() {
  const resultDiv = document.getElementById("finalResult");
  if (!resultDiv) return;
  showLoading(resultDiv);

  setTimeout(() => {
    const current = parseFloat(document.getElementById("currentGrade")?.value);
    const weight = parseFloat(document.getElementById("finalWeight")?.value);
    const target = parseFloat(document.getElementById("targetGrade")?.value);

    if (isNaN(current) || isNaN(weight) || isNaN(target)) {
      showResult(resultDiv, "danger", "Please fill all fields with valid numbers.");
      return;
    }

    if (weight <= 0 || weight >= 100) {
      showResult(resultDiv, "danger", "Final exam weight must be between 1% and 99%.");
      return;
    }

    const required = (target - current * (1 - weight / 100)) / (weight / 100);

    if (required > 100) {
      const maxPossible = (current * (1 - weight / 100) + 100 * (weight / 100)).toFixed(2);
      showResult(resultDiv, "warning", `Impossible: You need ${required.toFixed(2)}% on the final. Maximum possible grade is ${maxPossible}%.`);
    } else if (required < 0) {
      showResult(resultDiv, "success", `You're safe! Even with 0% on the final, you'll get ${(current * (1 - weight / 100)).toFixed(2)}%.`);
    } else {
      showResult(resultDiv, "success", `You need ${required.toFixed(2)}% on the final exam to reach ${target}%. Good luck! 🎯`);
    }
  }, 150);
}

function clearFinal() {
  ["currentGrade", "finalWeight", "targetGrade"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const resultDiv = document.getElementById("finalResult");
  if (resultDiv) {
    resultDiv.textContent = "";
    resultDiv.className = "result";
    resultDiv.style.display = "none";
  }
}

// ============================================
// WEIGHTED GRADE CALCULATOR
// ============================================
function createFormGroup(labelText, inputConfig) {
  const div = document.createElement("div");
  div.className = "form-group";

  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  Object.assign(input, inputConfig);

  div.appendChild(label);
  div.appendChild(input);
  return div;
}

function addAssignment() {
  const container = document.getElementById("assignments");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "course-row";
  row.setAttribute("role", "listitem");

  row.appendChild(createFormGroup("Assignment Name (optional)", {
    type: "text",
    className: "assign-name",
    placeholder: "e.g. Midterm"
  }));

  row.appendChild(createFormGroup("Score (%)", {
    type: "number",
    className: "assign-score",
    min: "0",
    max: "100",
    step: "0.01",
    required: true
  }));

  row.appendChild(createFormGroup("Weight (%)", {
    type: "number",
    className: "assign-weight",
    min: "0",
    max: "100",
    step: "0.01",
    required: true
  }));

  const removeDiv = document.createElement("div");
  const removeBtn = document.createElement("button");
  removeBtn.className = "danger";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => row.remove();
  removeDiv.appendChild(removeBtn);
  row.appendChild(removeDiv);

  container.appendChild(row);
}

function calculateWeighted() {
  const resultDiv = document.getElementById("weightedResult");
  if (!resultDiv) return;
  showLoading(resultDiv);

  setTimeout(() => {
    const rows = document.querySelectorAll("#assignments .course-row");
    let totalWeighted = 0;
    let totalWeight = 0;
    let hasError = false;

    rows.forEach(row => {
      const score = parseFloat(row.querySelector(".assign-score").value);
      const weight = parseFloat(row.querySelector(".assign-weight").value);

      if (isNaN(score) || isNaN(weight)) {
        hasError = true;
        return;
      }

      totalWeighted += score * weight;
      totalWeight += weight;
    });

    if (hasError || rows.length === 0) {
      showResult(resultDiv, "danger", "Please fill all score and weight fields.");
      return;
    }

    if (totalWeight === 0) {
      showResult(resultDiv, "danger", "Total weight cannot be zero.");
      return;
    }

    const finalGrade = (totalWeighted / totalWeight).toFixed(2);

    if (Math.abs(totalWeight - 100) > 0.01) {
      const message = document.createElement("span");
      message.innerHTML = `Warning: Total weight is ${totalWeight.toFixed(1)}% (not 100%).<br>Your calculated grade: <strong>${finalGrade}%</strong>`;
      showResult(resultDiv, "warning", message);
    } else {
      showResult(resultDiv, "success", `Your weighted grade: ${finalGrade}% 🎉`);
    }
  }, 150);
}

function clearWeighted() {
  const container = document.getElementById("assignments");
  if (!container) return;
  container.innerHTML = "";
  addAssignment();
  const resultDiv = document.getElementById("weightedResult");
  if (resultDiv) {
    resultDiv.textContent = "";
    resultDiv.className = "result";
    resultDiv.style.display = "none";
  }
}

// ============================================
// GPA CALCULATOR
// ============================================
function createGradeSelect() {
  const select = document.createElement("select");
  select.className = "course-grade";
  GRADE_OPTIONS.forEach(grade => {
    const option = document.createElement("option");
    option.value = grade.value;
    option.textContent = grade.label;
    select.appendChild(option);
  });
  return select;
}

function addCourse() {
  const container = document.getElementById("courses");
  if (!container) return;

  const row = document.createElement("div");
  row.className = "course-row";
  row.setAttribute("role", "listitem");

  row.appendChild(createFormGroup("Course Name (optional)", {
    type: "text",
    className: "course-name",
    placeholder: "e.g. Physics"
  }));

  const gradeDiv = document.createElement("div");
  gradeDiv.className = "form-group";
  const gradeLabel = document.createElement("label");
  gradeLabel.textContent = "Letter Grade";
  gradeDiv.appendChild(gradeLabel);
  gradeDiv.appendChild(createGradeSelect());
  row.appendChild(gradeDiv);

  row.appendChild(createFormGroup("Credit Hours", {
    type: "number",
    className: "course-credits",
    min: "0.5",
    max: "20",
    step: "0.5",
    value: "3",
    required: true
  }));

  const removeDiv = document.createElement("div");
  const removeBtn = document.createElement("button");
  removeBtn.className = "danger";
  removeBtn.textContent = "Remove";
  removeBtn.onclick = () => row.remove();
  removeDiv.appendChild(removeBtn);
  row.appendChild(removeDiv);

  container.appendChild(row);
}

function calculateGPA() {
  const resultDiv = document.getElementById("gpaResult");
  if (!resultDiv) return;
  showLoading(resultDiv);

  setTimeout(() => {
    const scale = document.getElementById("gpaScale").value;
    const rows = document.querySelectorAll("#courses .course-row");

    let totalPoints = 0;
    let totalCredits = 0;

    rows.forEach(row => {
      const gradeVal = row.querySelector(".course-grade").value;
      const credits = parseFloat(row.querySelector(".course-credits").value);
      const points = SCALE_MAPS[scale][gradeVal];

      if (!isNaN(credits) && credits > 0) {
        totalPoints += points * credits;
        totalCredits += credits;
      }
    });

    if (totalCredits === 0) {
      showResult(resultDiv, "danger", "Add at least one course with valid credits.");
      return;
    }

    const gpa = (totalPoints / totalCredits).toFixed(2);
    const scaleName = scale === "us" ? "4.0" : scale === "uk" ? "UK" : "ECTS";
    const message = document.createElement("span");
    message.innerHTML = `Your GPA: <strong>${gpa}</strong> on ${scaleName} scale 🎓`;
    showResult(resultDiv, "success", message);
  }, 150);
}

function clearGPA() {
  const container = document.getElementById("courses");
  if (!container) return;
  container.innerHTML = "";
  addCourse();
  const resultDiv = document.getElementById("gpaResult");
  if (resultDiv) {
    resultDiv.textContent = "";
    resultDiv.className = "result";
    resultDiv.style.display = "none";
  }
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // Final Calculator
  document.getElementById("calculateFinalBtn")?.addEventListener("click", calculateFinal);
  document.getElementById("clearFinalBtn")?.addEventListener("click", clearFinal);

  // Enter key for Final
  document.querySelectorAll("#currentGrade, #finalWeight, #targetGrade").forEach(input => {
    input?.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        calculateFinal();
      }
    });
  });

  // Weighted Calculator
  document.getElementById("addAssignmentBtn")?.addEventListener("click", addAssignment);
  document.getElementById("calculateWeightedBtn")?.addEventListener("click", calculateWeighted);
  document.getElementById("clearWeightedBtn")?.addEventListener("click", clearWeighted);

  // Enter key for Weighted
  document.getElementById("assignments")?.addEventListener("keypress", e => {
    if (e.key === "Enter" && e.target.matches(".assign-score, .assign-weight")) {
      e.preventDefault();
      calculateWeighted();
    }
  });

  // GPA Calculator
  document.getElementById("addCourseBtn")?.addEventListener("click", addCourse);
  document.getElementById("calculateGPABtn")?.addEventListener("click", calculateGPA);
  document.getElementById("clearGPABtn")?.addEventListener("click", clearGPA);

  // Enter key for GPA
  document.getElementById("courses")?.addEventListener("keypress", e => {
    if (e.key === "Enter" && e.target.matches(".course-credits")) {
      e.preventDefault();
      calculateGPA();
    }
  });

  // Initialize rows
  if (document.getElementById("assignments")) {
    clearWeighted();
    addAssignment();
  }
  if (document.getElementById("courses")) {
    clearGPA();
    addCourse();
  }
});
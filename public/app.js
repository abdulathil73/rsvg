// Simple frontend for calorie calculator, plans preview, log saving

async function fetchPlanMeta(){
  const res = await fetch('/api/plan');
  return res.json();
}

function calcBMR(weight, height, age, sex='male'){
  // Mifflin-St Jeor
  let s = (sex==='male')?5:-161;
  return Math.round(10*weight + 6.25*height - 5*age + s);
}

function showPlan(){
  const planHtml = `
  <h4>4-Month Summary (4 days/wk)</h4>
  <ol>
    <li>Weeks 1-4: Build foundation — 3-4 sets, 8-12 reps, moderate weights. Focus on compound lifts (Squat, Deadlift, Bench, Rows, Overhead Press).</li>
    <li>Weeks 5-8: Progressive overload — increase volume or intensity, add accessory work for weak points.</li>
    <li>Weeks 9-12: Strength phase with lower rep ranges on main lifts (4-6), keep hypertrophy accessories (8-12).</li>
    <li>Weeks 13-16: Peak hypertrophy — slightly higher volume and focus on mind-muscle connection, deload week at week 16.</li>
  </ol>
  <p>Detailed per-week plan and exercise list is included in the downloadable pack (in this site). Train 4 days: Upper/Lower/Push/Pull split (or Push/Legs/Pull/Upper rotation). Rest 2-3 minutes for heavy sets, 60-90s for accessories.</p>
  `;
  document.getElementById('planPreview').innerHTML = planHtml;
}

function calcMacros(bmr, activityFactor, goal){
  const tdee = Math.round(bmr * activityFactor);
  let surplus = 0;
  if(goal === 'mild_gain') surplus = 300;
  if(goal === 'aggressive_gain') surplus = 500;
  const targetCalories = tdee + surplus;
  // Protein 2.0 g/kg, fat 25% cal, rest carbs
  const weight = parseFloat(document.getElementById('weight').value) || 60;
  const proteinG = Math.round(2.0 * weight);
  const proteinCal = proteinG * 4;
  const fatCal = Math.round(targetCalories * 0.25);
  const fatG = Math.round(fatCal / 9);
  const carbsCal = targetCalories - proteinCal - fatCal;
  const carbsG = Math.round(carbsCal / 4);
  return {tdee, targetCalories, proteinG, fatG, carbsG};
}

// Calculator form
document.getElementById('calcForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const weight = +document.getElementById('weight').value;
  const height = +document.getElementById('height').value;
  const age = +document.getElementById('age').value;
  const activity = +document.getElementById('activity').value;
  const goal = document.getElementById('goal').value;
  const bmr = calcBMR(weight,height,age);
  const macros = calcMacros(bmr, activity, goal);
  document.getElementById('calcResult').innerHTML = `BMR: ${bmr} kcal/day<br>TDEE: ${macros.tdee} kcal/day<br><strong>Target calories: ${macros.targetCalories} kcal/day</strong><br>Protein: ${macros.proteinG} g/day<br>Fat: ${macros.fatG} g/day<br>Carbs: ${macros.carbsG} g/day`;
});

// Logging previous max
const logForm = document.getElementById('logForm');
logForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const date = document.getElementById('logDate').value;
  const exercise = document.getElementById('exercise').value;
  const max_weight = +document.getElementById('maxWeight').value;
  const max_reps = +document.getElementById('maxReps').value;
  const res = await fetch('/api/logs', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,exercise,max_weight,max_reps})});
  const j = await res.json();
  if(j.error) document.getElementById('logResult').innerText = 'Error: '+j.error;
  else document.getElementById('logResult').innerText = 'Saved (id='+j.id+')';
  loadLogs();
});

async function loadLogs(){
  const res = await fetch('/api/logs');
  const rows = await res.json();
  const tbody = document.querySelector('#logsTable tbody');
  tbody.innerHTML = '';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date}</td><td>${r.exercise}</td><td>${r.max_weight}</td><td>${r.max_reps}</td>`;
    tbody.appendChild(tr);
  });
}

// Diet preview and budget (static generated values tailored to the user)
function showDietAndBudget(){
  const dietHtml = `
  <h4>Sample daily meal structure (target ~+300 kcal surplus)</h4>
  <ul>
    <li>Breakfast: Oats, milk, whey, banana, peanut butter (high-protein)</li>
    <li>Snack: Greek yogurt + berries + nuts</li>
    <li>Lunch: Chicken breast, rice, mixed veggies, olive oil</li>
    <li>Pre-workout: Rice cake / banana + small protein</li>
    <li>Post-workout: Whey shake + fast carbs (juice/rice)
    <li>Dinner: Salmon/lean beef, sweet potato, salad</li>
    <li>Evening: Cottage cheese or casein + berries</li>
  </ul>
  <p>Daily protein target ~120-140g, keep calories in a +300 surplus to start and adjust based on weekly weight changes (aim +0.25-0.5 kg/week ideally).</p>`;
  document.getElementById('dietPreview').innerHTML = dietHtml;

  const budgetRows = [
    ['Chicken breast (1.5 kg)','$12.00','Protein staple, ~6-8 meals'],
    ['Rice (5 kg)','$6.00','Carb staple, many servings'],
    ['Oats (1 kg)','$3.50','Breakfast base'],
    ['Whey (2 kg)','$40.00','Protein supplement, lasts ~2 months'],
    ['Eggs (30)','$5.50','Versatile protein'],
    ['Milk (6L)','$6.00','Protein & calories'],
    ['Veggies & fruit','$10.00','Micros'],
    ['Peanut butter (1 jar)','$4.00','Calories & fat'],
    ['Nuts (250g)','$5.00','Snack & fats']
  ];
  let html = '<table><thead><tr><th>Item</th><th>Weekly cost (est)</th><th>Notes</th></tr></thead><tbody>';
  budgetRows.forEach(r=> html += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`);
  html += '</tbody></table><p><strong>Estimated weekly grocery budget:</strong> $92 (approx)</p>';
  document.getElementById('budgetTable').innerHTML = html;
}

// Init
showPlan();
showDietAndBudget();
loadLogs();

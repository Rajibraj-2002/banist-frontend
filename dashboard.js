"use strict";

// === API URLs ===
const API_BASE = 'http://localhost:8000/api/dashboard/summary/';
const DOWNLOAD_URL = 'http://localhost:8000/api/download-statements/';
const REFRESH_URL = 'http://localhost:8000/api/token/refresh/';
const LOGOUT_URL = 'http://localhost:8000/api/logout/';
const RESET_PASSWORD_URL = 'http://localhost:8000/api/reset-password/';
const SAVE_PROFILE_URL = 'http://localhost:8000/api/save-profile/';
const SEND_OTP_URL = 'http://localhost:8000/api/send-otp/';
const VERIFY_OTP_URL = 'http://localhost:8000/api/verify-otp/';
const MAKE_TX_URL = 'http://localhost:8000/api/make_transaction/';
const USER_PROFILE_URL = 'http://localhost:8000/api/dashboard/summary/';

// === DOM Elements ===
const welcomeEl = document.getElementById('welcome-message');
const balanceEl = document.getElementById('balance');
const txList = document.getElementById('transactionsList');
const searchInput = document.getElementById('searchInput');
const monthFilter = document.getElementById('monthFilter');
const dateFilter = document.getElementById('dateFilter');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const downloadBtn = document.getElementById('downloadPdfBtn');
const logoutBtn = document.getElementById('logoutBtn');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const resetMessage = document.getElementById('resetMessage');
const profileForm = document.getElementById('profileForm');
const profilePhoto = document.getElementById('profilePhoto');
const profileSaveMsg = document.getElementById('profileSaveMsg');
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const toast = document.getElementById('globalToast');
const dropdownMenu = document.getElementById('dropdownMenu');
const profileDropdown = document.getElementById('profileDropdown');
const profileMenu = document.getElementById('profileMenu');
const helpMenu = document.getElementById('helpMenu');

const sections = {
  home: document.getElementById('homeSection'),
  balance: document.getElementById('balanceSection'),
  statements: document.getElementById('statementsSection'),
  settings: document.getElementById('settingsSection'),
  transfer: document.getElementById('transferSection')
};

const toUsernameInput = document.getElementById('toUsername');
const transferAmountInput = document.getElementById('transferAmount');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpCodeInput = document.getElementById('otpCodeInput');
const verifyOtpBtn = document.getElementById('verifyOtpTransferBtn');
const transferMsg = document.getElementById('transferMsg');
const otpTransferContainer = document.getElementById('otpTransferContainer');

let transactions = [];
document.body.style.display = 'none';

function showToast(message) {
  toast.textContent = message;
  toast.style.animation = 'none';
  toast.offsetHeight;
  toast.style.animation = null;
  toast.classList.remove('hidden');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function getTokens() {
  return {
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('refresh')
  };
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return false;

  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem('access', data.access);
    return data.access;
  }
  return false;
}

function hideAllSections() {
  Object.values(sections).forEach(section => section.style.display = 'none');
}

function showSection(name) {
  hideAllSections();
  if (sections[name]) sections[name].style.display = 'flex';
}

function renderTransactions(list) {
  txList.innerHTML = '';
  if (!list.length) {
    txList.innerHTML = '<li>No transactions found</li>';
    return;
  }
  list.forEach(tx => {
    const li = document.createElement('li');
    li.className = `tx-item ${tx.type.toLowerCase()}`;
    li.innerHTML = `
      <span class="tx-type">${tx.type}</span>
      <span class="tx-amount">₹${tx.amount}</span>
      <span class="tx-user">${tx.user}</span>
      <span class="tx-time">${new Date(tx.timestamp).toLocaleString()}</span>
    `;
    txList.appendChild(li);
  });
}

function applyFilters() {
  const keyword = searchInput.value.toLowerCase();
  const month = monthFilter.value;
  const date = dateFilter.value;

  let filtered = [...transactions];
  if (keyword) filtered = filtered.filter(tx => tx.user.toLowerCase().includes(keyword));
  if (month) filtered = filtered.filter(tx => new Date(tx.timestamp).toISOString().slice(0, 7) === month);
  if (date) filtered = filtered.filter(tx => new Date(tx.timestamp).toISOString().split('T')[0] === date);
  renderTransactions(filtered);
}

async function fetchDashboardData() {
  let { access } = getTokens();
  if (!access) return window.location.href = 'bankist.html';

  let res = await fetch(API_BASE, { headers: { Authorization: `Bearer ${access}` } });

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      localStorage.clear();
      return (window.location.href = 'bankist.html');
    }
    access = newAccess;
    res = await fetch(API_BASE, { headers: { Authorization: `Bearer ${access}` } });
  }

  if (res.ok) {
    const data = await res.json();
    welcomeEl.textContent = data.username;
    balanceEl.textContent = `₹${data.balance.toFixed(2)}`;
    transactions = data.recent_transactions;
    renderTransactions(transactions);
    document.body.style.display = 'flex';
    showSection('home');
    showToast('✅ Login successful!');
    if (data.profile?.photo_url) {
      profilePhoto.src = data.profile.photo_url;
      profilePhoto.style.display = 'inline-block';
    } else {
      profilePhoto.style.display = 'none';
    }
  } else {
    alert('Failed to fetch dashboard data');
    window.location.href = 'bankist.html';
  }
}

window.addEventListener('DOMContentLoaded', fetchDashboardData);

sidebarLinks.forEach(link => {
  const section = link.getAttribute('data-section');
  if (section) {
    link.addEventListener('click', () => {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      showSection(section);
    });
  }
});

logoutBtn.addEventListener('click', async () => {
  const { access, refresh } = getTokens();
  if (access && refresh) {
    await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`
      },
      body: JSON.stringify({ refresh })
    });
  }
  localStorage.clear();
  showToast('🔒 Logged out.');
  setTimeout(() => (window.location.href = 'bankist.html'), 1000);
});

downloadBtn?.addEventListener('click', async () => {
  const access = localStorage.getItem('access');
  const username = welcomeEl.textContent;
  const balanceText = balanceEl.textContent.replace(/[₹,]/g, '').trim();

  const url = `${DOWNLOAD_URL}?username=${encodeURIComponent(username)}&balance=${encodeURIComponent(balanceText)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${access}` }
  });

  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${username}.pdf`;
    a.click();
  } else {
    showToast('❌ PDF download failed');
  }
});

searchInput?.addEventListener('input', applyFilters);
monthFilter?.addEventListener('change', applyFilters);
dateFilter?.addEventListener('change', applyFilters);

themeToggleBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
});

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
updateClock();
setInterval(updateClock, 1000);

resetPasswordBtn?.addEventListener('click', async () => {
  const current = currentPasswordInput.value;
  const newPass = newPasswordInput.value;
  const confirm = confirmPasswordInput.value;

  resetMessage.textContent = '';
  resetMessage.style.color = 'green';

  if (!current || !newPass || !confirm) {
    resetMessage.textContent = 'Please fill in all fields.';
    resetMessage.style.color = 'red';
    return;
  }

  if (newPass !== confirm) {
    resetMessage.textContent = 'New passwords do not match.';
    resetMessage.style.color = 'red';
    return;
  }

  const access = localStorage.getItem('access');
  const res = await fetch(RESET_PASSWORD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access}`
    },
    body: JSON.stringify({
      current_password: current,
      new_password: newPass
    })
  });

  const data = await res.json();

  if (res.ok) {
    showToast('✅ Password changed!');
    resetMessage.textContent = 'Password reset successful!';
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
  } else {
    resetMessage.textContent = data.message || data.error || 'Password reset failed.';
    resetMessage.style.color = 'red';
    showToast('❌ Something went wrong!');
  }
});

profileForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const access = localStorage.getItem('access');
  if (!access) return alert('Unauthorized');

  const formData = new FormData(profileForm);
  const res = await fetch(SAVE_PROFILE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}` },
    body: formData
  });

  const data = await res.json();

  if (res.ok) {
    profileSaveMsg.textContent = 'Profile saved successfully';
    showToast('✅ Profile updated successfully');
    if (data.photo_url) {
      profilePhoto.src = data.photo_url;
      profilePhoto.style.display = 'inline-block';
    }
  } else {
    profileSaveMsg.textContent = data.error || 'Failed to save profile';
    profileSaveMsg.style.color = 'red';
  }
});

sendOtpBtn?.addEventListener('click', async () => {
  const username = welcomeEl.textContent;
  const access = localStorage.getItem('access');
  if (!username || !access) return alert('User info missing.');

  const res = await fetch(SEND_OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const data = await res.json();
  if (res.ok) {
    otpTransferContainer.style.display = 'block';
    showToast('OTP sent to your email and phone.');
  } else {
    showToast(data.error || 'Failed to send OTP.');
  }
});

verifyOtpBtn?.addEventListener('click', async () => {
  const username = welcomeEl.textContent;
  const otpCode = otpCodeInput.value;
  const to = toUsernameInput.value;
  const amount = parseFloat(transferAmountInput.value);
  const access = localStorage.getItem('access');

  transferMsg.textContent = '';
  transferMsg.style.color = 'green';

  if (!username || !otpCode || !to || !amount || !access) {
    transferMsg.textContent = 'Please complete all fields.';
    transferMsg.style.color = 'red';
    return;
  }

  const verifyRes = await fetch(VERIFY_OTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, code: otpCode })
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) {
    transferMsg.textContent = verifyData.error || 'OTP verification failed.';
    transferMsg.style.color = 'red';
    showToast('❌ Something went wrong!');
    return;
  }

  const txRes = await fetch(MAKE_TX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${access}`
    },
    body: JSON.stringify({ to, amount })
  });

  const txData = await txRes.json();
  if (txRes.ok) {
    transferMsg.textContent = 'Transaction successful!';
    otpTransferContainer.style.display = 'none';
    otpCodeInput.value = '';
    toUsernameInput.value = '';
    transferAmountInput.value = '';
    fetchDashboardData();
    showToast('✅ Transaction successful!');
  } else {
    transferMsg.textContent = txData.error || 'Transaction failed.';
    transferMsg.style.color = 'red';
    showToast('❌ Transaction failed!');
  }
});

// === Dropdown Toggle with Animation ===
profilePhoto?.addEventListener('click', () => {
  dropdownMenu.classList.toggle('show');
});

// Hide dropdown on outside click
window.addEventListener('click', (e) => {
  if (!profileDropdown.contains(e.target)) {
    dropdownMenu.classList.remove('show');
  }
});

// Dummy handlers for Profile & Help
profileMenu?.addEventListener('click', () => showToast('👤 Profile clicked!'));
helpMenu?.addEventListener('click', () => showToast('❓ Help clicked!'));

//===============================================================================================================
// For the side-baar collapse........

const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

//===============================================================================================================
// for district and states names.......

const stateDistrictMap = {
  "Andhra Pradesh": ["Anantapur","Chittoor","East Godavari","Guntur","Krishna","Kurnool","Nellore","Prakasam","Srikakulam","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"],

  "Arunachal Pradesh": ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tirap","Tawang","Upper Dibang Valley","Upper Kameng", "Upper Siang","Upper Subansiri","West Kameng","West Siang","Central Siang",
],

"Assam": ["Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup Metropolitan","Kamrup Rural","Karbi Anglong","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong","West Siang" 
],

"Bihar": ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"
],

"Chhattisgarh": ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Kondagaon","Korba","Koriya","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sukma","Surajpur","Surguja"
],

"Goa": ["North Goa","South Goa"
],

"Gujarat": ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"
],

"Haryana": ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"
],

"Himachal Pradesh": ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"
],

"Jharkhand": ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahibganj","Seraikela Kharsawan","Simdega","West Singhbhum"
],

"Karnataka": ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir","Vijayanagara"
],

"Kerala": ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"
],

"Madhya Pradesh": ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua", "Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"
  ],

  "Maharashtra": ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"
  ],
  "Manipur": ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"
  ],
  "Meghalaya": ["East Garo Hills","East Jaintia Hills","East Khasi Hills","North Garo Hills","Ribhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills","Eastern West Khasi Hills"
  ],
  "Mizoram": ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Saitual","Serchhip"
  ],
  "Nagaland": [
    "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon",
    "Noklak", "Peren", "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha", "Zunheboto", "Niuland"
  ],
  "Odisha": [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal",
    "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara",
    "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh",
    "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh"
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur",
    "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Mohali (SAS Nagar)",
    "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi",
    "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Ganganagar", "Hanumangarh", "Jaipur",
    "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali",
    "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Tonk", "Udaipur"
  ],
  "Sikkim": [
    "Gangtok", "Gyalshing (West Sikkim)", "Mangan (North Sikkim)", "Namchi (South Sikkim)"
  ],
  "Tamil Nadu": [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
    "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
    "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi",
    "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvannamalai", "Vellore", "Viluppuram",
    "Virudhunagar"
  ],
  "Telangana": [
    "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally",
    "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad",
    "Mahabubnagar", "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
    "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy",
    "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Badaun",
    "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi",
    "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad",
    "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur",
    "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat",
    "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj",
    "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar",
    "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Sant Ravidas Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
    "Sultanpur", "Unnao", "Varanasi"
  ],
  "Uttarakhand": [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal",
    "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
  ],
  "West Bengal": [
    "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah",
    "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas",
    "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia",
    "South 24 Parganas", "Uttar Dinajpur"
  ],
  "Andaman and Nicobar Islands": [
    "North & Middle Andaman", "South Andaman", "Nicobar"
  ],
  "Chandigarh": [
    "Chandigarh"
  ],
  "Dad. & Nagar Haveli & Daman & Diu": [
    "Dadra & Nagar Haveli", "Daman", "Diu"
  ],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi","Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"
  ],
  "Jammu & Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar","Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar","Udhampur"
  ],
  "Ladakh": [
    "Kargil", "Leh"
  ],
  "Lakshadweep": [
    "Lakshadweep"
  ],
  "Puducherry": [
    "Karaikal", "Mahe", "Puducherry", "Yanam"
  ]

};

const stateSelect = document.getElementById("stateSelect");
const districtSelect = document.getElementById("districtSelect");

// Populate state dropdown
function populateStates() {
  Object.keys(stateDistrictMap).forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });
}

// Update districts based on selected state
stateSelect.addEventListener("change", () => {
  const selectedState = stateSelect.value;
  districtSelect.innerHTML = '<option value="">Select District</option>';

  if (selectedState && stateDistrictMap[selectedState]) {
    stateDistrictMap[selectedState].forEach((district) => {
      const option = document.createElement("option");
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
  }
});

// Initial setup
document.addEventListener("DOMContentLoaded", populateStates);

//=================================================================================================/
//see profile details........................................................................

// document.getElementById('profileMenu').addEventListener('click', () => {
//   // Read profile data from localStorage
//   const profileData = {
//     photo: localStorage.getItem('photo'),
//     first_name: localStorage.getItem('first_name'),
//     last_name: localStorage.getItem('last_name'),
//     pan_number: localStorage.getItem('pan_number'),
//     aadhaar_number: localStorage.getItem('aadhaar_number'),
//     address_lane1: localStorage.getItem('address_lane1'),
//     pin_code: localStorage.getItem('pin_code'),
//     state: localStorage.getItem('state'),
//     district: localStorage.getItem('district'),
//     gender: localStorage.getItem('gender'),
//   };

//   // Fill modal fields
//   document.getElementById('modalPhoto').src = profileData.photo || '';
//   document.getElementById('modalFirstName').textContent = profileData.first_name || '';
//   document.getElementById('modalLastName').textContent = profileData.last_name || '';
//   document.getElementById('modalPan').textContent = profileData.pan_number || '';
//   document.getElementById('modalAadhaar').textContent = profileData.aadhaar_number || '';
//   document.getElementById('modalAddress').textContent = profileData.address_lane1 || '';
//   document.getElementById('modalPincode').textContent = profileData.pin_code || '';
//   document.getElementById('modalState').textContent = profileData.state || '';
//   document.getElementById('modalDistrict').textContent = profileData.district || '';
//   document.getElementById('modalGender').textContent = profileData.gender || '';

//   // Show modal
//   document.getElementById('profileModal').classList.add('show');
// });

// // Close modal button
// document.getElementById('closeProfileModal').addEventListener('click', () => {
//   document.getElementById('profileModal').classList.remove('show');
// });

document.getElementById('profileMenu').addEventListener('click', async () => {
  const access = localStorage.getItem('access');
  if (!access) return alert('Unauthorized');

  try {
    const res = await fetch('http://localhost:8000/api/dashboard/summary/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }

    const data = await res.json();
    const profileData = data.profile || {};

    document.getElementById('modalPhoto').src = profileData.photo_url || '';
    document.getElementById('modalFirstName').textContent = profileData.first_name || '';
    document.getElementById('modalLastName').textContent = profileData.last_name || '';
    document.getElementById('modalPan').textContent = profileData.pancard || '';
    document.getElementById('modalAadhaar').textContent = profileData.aadhaar || '';
    document.getElementById('modalAddress').textContent = profileData.address_line1 || '';
    document.getElementById('modalPincode').textContent = profileData.pin_code || '';
    document.getElementById('modalState').textContent = profileData.state || '';
    document.getElementById('modalDistrict').textContent = profileData.district || '';
    document.getElementById('modalGender').textContent = profileData.gender || '';

    document.getElementById('profileModal').classList.add('show');
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load profile.');
  }
});

// 2. Close modal when "×" is clicked
document.getElementById('closeProfileModal').addEventListener('click', () => {
  document.getElementById('profileModal').classList.remove('show');
});

// 3. Optional: Close modal if user clicks outside the modal content
window.addEventListener('click', (e) => {
  const modal = document.getElementById('profileModal');
  if (e.target === modal) {
    modal.classList.remove('show');
  }
});


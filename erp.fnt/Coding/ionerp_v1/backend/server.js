const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8003;

// Allow CORS with credentials so the frontend's axiosInstance (withCredentials:true) works in dev
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

// In-memory datastore (initial state snapshot + live arrays)
let nextWaitlistId = 1;
let nextShortlistId = 1;

const initialApplications = [
  { application_id: 1, student_name: 'Alice Johnson', usn: 'USN001', branch: 'CSE', cgpa: 8.6, drive_name: 'Acme Corp', status: 'APPLIED', applied_at: new Date(Date.now() - 5*24*3600*1000).toISOString() },
  { application_id: 2, student_name: 'Bob Smith', usn: 'USN002', branch: 'ECE', cgpa: 7.9, drive_name: 'Acme Corp', status: 'APPLIED', applied_at: new Date(Date.now() - 4*24*3600*1000).toISOString() },
  { application_id: 3, student_name: 'Charlie Lee', usn: 'USN003', branch: 'ME', cgpa: 8.1, drive_name: 'Acme Corp', status: 'APPLIED', applied_at: new Date(Date.now() - 3*24*3600*1000).toISOString() },
  { application_id: 4, student_name: 'Diana Prince', usn: 'USN004', branch: 'CSE', cgpa: 9.1, drive_name: 'Globex Ltd', status: 'APPLIED', applied_at: new Date(Date.now() - 2*24*3600*1000).toISOString() },
];

const initialWaitlist = [
  // empty by default
];

const initialShortlist = [
  // empty by default
];

// live arrays (will be mutated)
const applications = [];
const waitlist = [];
const shortlist = [];

function resetData() {
  // reset ids
  nextWaitlistId = 1;
  nextShortlistId = 1;

  // reset arrays by clearing and pushing initial items
  applications.length = 0;
  initialApplications.forEach((a) => applications.push(Object.assign({}, a)));

  waitlist.length = 0;
  initialWaitlist.forEach((w) => waitlist.push(Object.assign({}, w)));

  shortlist.length = 0;
  initialShortlist.forEach((s) => shortlist.push(Object.assign({}, s)));
}

// initialize live data
resetData();

function findApplication(appId) {
  return applications.find((a) => Number(a.application_id) === Number(appId));
}

// return application list
app.post('/plm/application_list', (req, res) => {
  // Support optional filters in body: drive, status, branch
  const { drive, status, branch } = req.body || {};
  let rows = applications.slice();
  if (drive) rows = rows.filter((r) => (r.drive_name || r.drive || '').toLowerCase().includes(String(drive).toLowerCase()));
  if (status) rows = rows.filter((r) => String(r.status).toLowerCase() === String(status).toLowerCase());
  if (branch) rows = rows.filter((r) => String(r.branch).toLowerCase() === String(branch).toLowerCase());
  return res.json({ success: true, data: rows });
});

// Shortlist endpoints
app.post('/plm/shortlist/list', (req, res) => {
  // return current shortlist entries
  return res.json({ success: true, data: shortlist });
});

app.post('/plm/shortlist/create', (req, res) => {
  const { application_id, shortlist_type } = req.body || {};
  if (!application_id) return res.status(400).json({ success: false, message: 'application_id is required' });
  const app = findApplication(application_id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  // validation: one shortlist per application
  if (shortlist.some((s) => Number(s.application_id) === Number(application_id))) {
    return res.status(400).json({ success: false, message: 'Application already shortlisted' });
  }

  // create shortlist record
  const s = {
    shortlist_id: nextShortlistId++,
    application_id: Number(application_id),
    student_name: app.student_name,
    drive_name: app.drive_name || app.drive || '',
    shortlist_type: shortlist_type || 'MANUAL',
    shortlisted_at: new Date().toISOString(),
    status: 'SHORTLISTED',
  };
  shortlist.push(s);

  // update application status
  if (app) app.status = 'SHORTLISTED';

  // if the application was on waitlist, mark that waitlist entry as PROMOTED or remove it
  const wlIdx = waitlist.findIndex((w) => Number(w.application_id) === Number(application_id));
  if (wlIdx !== -1) {
    waitlist[wlIdx].status = 'PROMOTED';
  }

  return res.json({ success: true, data: s });
});

app.post('/plm/shortlist/withdraw', (req, res) => {
  const { shortlist_id, application_id } = req.body || {};
  if (!shortlist_id && !application_id) return res.status(400).json({ success: false, message: 'shortlist_id or application_id is required' });
  const sIdx = shortlist.findIndex((s) => (shortlist_id ? Number(s.shortlist_id) === Number(shortlist_id) : Number(s.application_id) === Number(application_id)));
  if (sIdx === -1) return res.status(404).json({ success: false, message: 'Shortlist entry not found' });

  const sEntry = shortlist[sIdx];

  // mark as withdrawn
  sEntry.status = 'WITHDRAWN';

  // update application status
  const app = findApplication(sEntry.application_id);
  if (app) app.status = 'WITHDRAWN';

  // remove or mark the shortlist entry removed: we'll keep entry but status changed

  // Now promote position 1 from waitlist (if any) for the same drive
  const driveName = sEntry.drive_name;
  const candidates = waitlist.filter((w) => w.drive_name === driveName && w.status === 'WAITLISTED').sort((a,b) => a.position - b.position);
  if (candidates.length > 0) {
    const promote = candidates[0];
    // create shortlist for promoted candidate
    const promotedApp = findApplication(promote.application_id);
    // ensure no shortlist exists for promoted application (shouldn't)
    if (!shortlist.some((x) => Number(x.application_id) === Number(promote.application_id))) {
      const newShort = {
        shortlist_id: nextShortlistId++,
        application_id: Number(promote.application_id),
        student_name: promotedApp?.student_name || 'Unknown',
        drive_name: driveName,
        shortlist_type: 'PROMOTION',
        shortlisted_at: new Date().toISOString(),
        status: 'SHORTLISTED',
      };
      shortlist.push(newShort);
      if (promotedApp) promotedApp.status = 'SHORTLISTED';
    }

    // update the promoted waitlist entry
    promote.status = 'PROMOTED';

    // compress remaining waitlist positions for the drive
    const remaining = waitlist.filter((w) => w.drive_name === driveName && w.status === 'WAITLISTED').sort((a,b)=>a.position-b.position);
    for (let i = 0; i < remaining.length; i++) remaining[i].position = i + 1;
  }

  return res.json({ success: true, data: { withdrawn: sEntry, promoted: candidates && candidates.length > 0 ? candidates[0] : null } });
});

// Basic GET root and health endpoints for quick browser checks
app.get('/', (req, res) => {
  res.send('<h2>PLM Mock Backend</h2><p>Use POST endpoints under /plm/* e.g. <code>/plm/waitlist/list</code></p>');
});

// reset to initial sample data
app.post('/plm/reset', (req, res) => {
  try {
    resetData();
    return res.json({ success: true, message: 'Data reset to initial sample state' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset data', error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// return waitlist
app.post('/plm/waitlist/list', (req, res) => {
  // include student_name and drive_name in each entry
  const rows = waitlist.map((w) => ({ ...w }));
  return res.json({ success: true, data: rows });
});

// create waitlist entry
app.post('/plm/waitlist/create', (req, res) => {
  const { application_id, position } = req.body || {};
  if (!application_id) return res.status(400).json({ success: false, message: 'application_id is required' });
  const app = findApplication(application_id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  // validation: one waitlist per application
  if (waitlist.some((w) => Number(w.application_id) === Number(application_id))) {
    return res.status(400).json({ success: false, message: 'Application already on waitlist' });
  }

  // determine position
  const driveName = app.drive_name || app.drive || '';
  let pos = Number(position) || 0;
  if (!pos || pos < 1) {
    const positions = waitlist.filter((w) => w.drive_name === driveName).map((w) => Number(w.position) || 0);
    pos = positions.length === 0 ? 1 : Math.max(...positions) + 1;
  }

  // position uniqueness
  if (waitlist.some((w) => w.drive_name === driveName && Number(w.position) === pos)) {
    return res.status(400).json({ success: false, message: 'Position already taken for this drive' });
  }

  const entry = {
    waitlist_id: nextWaitlistId++,
    application_id: Number(application_id),
    student_name: app.student_name,
    drive_name: driveName,
    position: pos,
    waitlisted_at: new Date().toISOString(),
    status: 'WAITLISTED',
  };
  waitlist.push(entry);

  // update application status
  const appRef = findApplication(application_id);
  if (appRef) appRef.status = 'WAITLISTED';

  return res.json({ success: true, data: entry });
});

// update application (status changes etc.)
app.post('/plm/application/update', (req, res) => {
  const { application_id, status } = req.body || {};
  if (!application_id) return res.status(400).json({ success: false, message: 'application_id is required' });
  const app = findApplication(application_id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
  if (status) app.status = status;
  return res.json({ success: true, data: app });
});

// promote from waitlist to shortlist
app.post('/plm/waitlist/promote', (req, res) => {
  const { waitlist_id, application_id } = req.body || {};
  if (!waitlist_id || !application_id) return res.status(400).json({ success: false, message: 'waitlist_id and application_id are required' });

  const entry = waitlist.find((w) => Number(w.waitlist_id) === Number(waitlist_id) && Number(w.application_id) === Number(application_id));
  if (!entry) return res.status(404).json({ success: false, message: 'Waitlist entry not found' });

  if (entry.status !== 'WAITLISTED') return res.status(400).json({ success: false, message: 'Only WAITLISTED entries can be promoted' });
  if (Number(entry.position) !== 1) return res.status(400).json({ success: false, message: 'Only position 1 can be promoted' });

  // validation: ensure there's no existing shortlist for this application
  if (shortlist.some((s) => Number(s.application_id) === Number(application_id))) {
    return res.status(400).json({ success: false, message: 'Application already shortlisted' });
  }

  // create shortlist entry
  const app = findApplication(application_id);
  const s = {
    shortlist_id: nextShortlistId++,
    application_id: Number(application_id),
    student_name: app?.student_name || 'Unknown',
    drive_name: entry.drive_name,
    shortlist_type: 'PROMOTION',
    shortlisted_at: new Date().toISOString(),
    status: 'SHORTLISTED',
  };
  shortlist.push(s);

  // update waitlist entry status
  entry.status = 'PROMOTED';

  // update application status
  if (app) app.status = 'SHORTLISTED';

  // After promoting, shift up other waitlist positions for that drive
  const sameDrive = waitlist.filter((w) => w.drive_name === entry.drive_name && w.status === 'WAITLISTED').sort((a,b)=>a.position-b.position);
  // remove the promoted entry from the waitlist array if desired, but we'll keep it with status PROMOTED
  // compress positions: ensure they are contiguous starting from 1 for WAITLISTED entries
  for (let i = 0; i < sameDrive.length; i++) {
    sameDrive[i].position = i + 1;
  }

  return res.json({ success: true, data: s });
});

app.listen(PORT, () => {
  console.log(`PLM mock backend running on http://localhost:${PORT}`);
});

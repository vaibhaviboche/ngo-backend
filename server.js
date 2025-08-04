require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Application = require('./models/application');

const authRoutes = require('./routes/auth');          // Auth routes
const authMiddleware = require('./middleware/authMiddleware'); // Auth middleware

const app = express();
app.use(cors());
app.use(express.json());
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Use the auth routes (signup, login)
app.use('/api/auth', authRoutes);

// Protected routes — require a valid JWT token to access

// POST: Submit Application (protected)
app.post('/api/applications', authMiddleware, async (req, res) => {
  try {
    const newApp = new Application(req.body);
    await newApp.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch Applications (protected)
app.get('/api/applications', authMiddleware, async (req, res) => {
  try {
    const status = req.query.status;
    const query = status && status !== 'All' ? { status } : {};
    const applications = await Application.find(query);
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Update Status (Approve / Reject) (protected)
app.put('/api/applications/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Status updated successfully', updated });
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Export CSV (protected)
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find();
    const csv = [
      ['Name', 'Email', 'Role', 'Message', 'Status'],
      ...applications.map(app => [
        app.name, app.email, app.role, app.message, app.status
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('applications.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("NGO backend is finally working! 🎉");

});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

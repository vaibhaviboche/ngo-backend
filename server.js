require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Application = require('./models/application');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// POST: Submit Application
app.post('/api/applications', async (req, res) => {
  try {
    const newApp = new Application(req.body);
    await newApp.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch Applications
app.get('/api/applications', async (req, res) => {
  try {
    const status = req.query.status;
    const query = status && status !== 'All' ? { status } : {};
    const applications = await Application.find(query);
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT: Update Status (Approve / Reject)
app.put('/api/applications/:id/status', async (req, res) => {
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

// GET: Export CSV
app.get('/api/export', async (req, res) => {
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Application state - stored in memory (no localStorage/sessionStorage)
let savedDraft = null;

// Get form and elements
const form = document.getElementById('tripReportForm');
const exportBtn = document.getElementById('exportBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const notification = document.getElementById('notification');

// Form field IDs
const formFields = [
  'trip_date', 'departure_time', 'return_time', 'overtime',
  'first_pickup_name', 'first_pickup_time', 'first_pickup_location',
  'other_employee_pickups', 'first_work_name', 'first_work_time',
  'first_work_location', 'other_pickups_day', 'last_departure_location',
  'last_departure_time', 'last_dropoff_name', 'last_dropoff_time',
  'last_dropoff_location', 'total_km', 'passenger_names',
  'passenger_signature', 'driver_signature', 'notes'
];

// Show notification
function showNotification(message, type = 'success') {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 4000);
}

// Get form data
function getFormData() {
  const data = {};
  formFields.forEach(field => {
    const element = document.getElementById(field);
    data[field] = element ? element.value : '';
  });
  return data;
}

// Set form data
function setFormData(data) {
  formFields.forEach(field => {
    const element = document.getElementById(field);
    if (element && data[field] !== undefined) {
      element.value = data[field];
    }
  });
}

// Escape CSV value
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
}

// Generate CSV content
function generateCSV(data) {
  const headers = [
    'Ngày đi',
    'Thời gian đi từ bãi xe',
    'Thời gian về bãi xe',
    'Tăng ca',
    'Điểm đón đầu tiên - Tên',
    'Điểm đón đầu tiên - Giờ',
    'Điểm đón đầu tiên - Địa điểm',
    'Điểm đón nhân viên khác',
    'Điểm làm việc đầu tiên - Tên',
    'Điểm làm việc đầu tiên - Giờ',
    'Điểm làm việc đầu tiên - Địa điểm',
    'Điểm đón khác trong ngày',
    'Rời nhà máy cuối cùng - Địa điểm',
    'Rời nhà máy cuối cùng - Giờ',
    'Trả nhân viên cuối cùng - Tên',
    'Trả nhân viên cuối cùng - Giờ',
    'Trả nhân viên cuối cùng - Địa điểm',
    'Số KM đi được',
    'Tên người đi xe',
    'Chữ ký Xác nhận người đi xe',
    'Chữ ký Xác nhận tài xế',
    'Ghi chú'
  ];

  const values = [
    data.trip_date,
    data.departure_time,
    data.return_time,
    data.overtime,
    data.first_pickup_name,
    data.first_pickup_time,
    data.first_pickup_location,
    data.other_employee_pickups,
    data.first_work_name,
    data.first_work_time,
    data.first_work_location,
    data.other_pickups_day,
    data.last_departure_location,
    data.last_departure_time,
    data.last_dropoff_name,
    data.last_dropoff_time,
    data.last_dropoff_location,
    data.total_km,
    data.passenger_names,
    data.passenger_signature,
    data.driver_signature,
    data.notes
  ];

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const headerRow = headers.map(h => escapeCSV(h)).join(',');
  const valueRow = values.map(v => escapeCSV(v)).join(',');
  
  return BOM + headerRow + '\n' + valueRow;
}

// Export to CSV
function exportToCSV(data) {
  const csvContent = generateCSV(data);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Generate filename
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `BaoCao_HanhTrinh_${dateStr}_${timeStr}.csv`;
  
  // Create download link
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Validate required fields
function validateForm() {
  const requiredFields = [
    { id: 'trip_date', label: 'Ngày đi' },
    { id: 'departure_time', label: 'Thời gian đi từ bãi xe' },
    { id: 'return_time', label: 'Thời gian về bãi xe' },
    { id: 'total_km', label: 'Số KM đi được' },
    { id: 'driver_signature', label: 'Chữ ký Xác nhận tài xế' }
  ];

  let isValid = true;
  const missingFields = [];

  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element.value.trim()) {
      isValid = false;
      missingFields.push(field.label);
      element.style.borderColor = 'var(--color-error)';
    } else {
      element.style.borderColor = '';
    }
  });

  if (!isValid) {
    showNotification(
      `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(', ')}`,
      'error'
    );
  }

  return isValid;
}

// Handle form submission (Export)
form.addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  const formData = getFormData();
  
  try {
    exportToCSV(formData);
    showNotification('Báo cáo đã được xuất thành công!', 'success');
  } catch (error) {
    showNotification('Lỗi khi xuất báo cáo. Vui lòng thử lại.', 'error');
    console.error('Export error:', error);
  }
});

// Clear form
clearFormBtn.addEventListener('click', function() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu form?')) {
    form.reset();
    // Clear any validation styles
    formFields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        element.style.borderColor = '';
      }
    });
    showNotification('Form đã được xóa', 'info');
  }
});

// Save draft
saveDraftBtn.addEventListener('click', function() {
  const formData = getFormData();
  savedDraft = formData;
  showNotification('Dữ liệu đã được lưu tạm', 'success');
});

// Restore draft on page load
window.addEventListener('load', function() {
  if (savedDraft) {
    const shouldRestore = confirm('Có dữ liệu lưu tạm. Bạn có muốn khôi phục không?');
    if (shouldRestore) {
      setFormData(savedDraft);
      showNotification('Đã khôi phục dữ liệu lưu tạm', 'info');
    }
  }
});

// Clear validation styling on input
formFields.forEach(fieldId => {
  const element = document.getElementById(fieldId);
  if (element) {
    element.addEventListener('input', function() {
      if (this.value.trim()) {
        this.style.borderColor = '';
      }
    });
  }
});
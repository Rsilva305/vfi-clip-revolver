let segments = [];

document.getElementById('video-upload').addEventListener('change', async (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach(file => formData.append('videos', file));

  try {
    document.getElementById('error-message').textContent = 'Uploading and processing videos...';

    // Send the videos to the backend
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Backend response:', result);

    if (result.segments && result.segments.length > 0) {
      segments = result.segments;
      renderSegments(); // Render segments after receiving the response
    } else {
      throw new Error('No segments were uploaded.');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('error-message').textContent = error.message || 'An error occurred.';
  }
});

function renderSegments() {
  const timeline = document.getElementById('timeline');

  console.log('Rendering segments:', segments);

  // Clear previous content
  timeline.innerHTML = '';

  if (segments.length === 0) {
    console.warn('No segments to render.');
    return;
  }

  segments.forEach((segment, index) => {
    // Create a container for the segment preview and label
    const segmentContainer = document.createElement('div');
    segmentContainer.className = 'segment-preview';
    segmentContainer.dataset.src = segment; // Store the video source as a data attribute

    // Create a video element for the preview
    const video = document.createElement('video');
    video.src = segment; // Set the source to the segment file path
    video.muted = true; // Mute audio to prevent overlapping sounds
    video.loop = true; // Loop the video for continuous preview
    video.style.width = '100%'; // Make the video fill the container
    video.style.height = '100px'; // Set a fixed height for consistency

    // Add the video to the container
    segmentContainer.appendChild(video);

    // Add a label for the segment
    const label = document.createElement('div');
    label.textContent = `Segment ${index + 1}`;
    label.style.textAlign = 'center';
    label.style.fontSize = '14px';
    segmentContainer.appendChild(label);

    // Add the container to the timeline
    timeline.appendChild(segmentContainer);
  });

  // Add event listeners to all segments
  addSegmentEventListeners();
}

function addSegmentEventListeners() {
  const segments = document.querySelectorAll('.segment-preview');

  segments.forEach(segment => {
    segment.addEventListener('click', handleSegmentClick);
  });
}

function handleSegmentClick(event) {
  const clickedSegment = event.currentTarget;

  // Remove active class from all segments
  const allSegments = document.querySelectorAll('.segment-preview');
  allSegments.forEach(segment => segment.classList.remove('active'));

  // Add active class to the clicked segment
  clickedSegment.classList.add('active');

  // Extract the video source from the clicked segment
  const videoSource = clickedSegment.dataset.src;

  // Update the preview video source
  const previewVideo = document.getElementById('preview-video');
  previewVideo.src = videoSource;

  // Start playing the preview video
  previewVideo.play();
}

document.getElementById('randomize-segments').addEventListener('click', () => {
  // Shuffle the segments array
  segments = shuffleArray([...segments]); // Use a copy of the array to avoid mutation issues
  console.log('Shuffled segments:', segments);

  // Re-render the timeline with the shuffled order
  renderSegments();
});

document.getElementById('export-video').addEventListener('click', async () => {
  try {
    document.getElementById('error-message').textContent = 'Exporting video...';

    // Send the current order of segments to the backend
    const response = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segments }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Trigger download of the concatenated video
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'concatenated_output.mp4';
    document.body.appendChild(a);
    a.click();
    a.remove();

    document.getElementById('error-message').textContent = 'Video exported successfully!';
  } catch (error) {
    console.error('Error exporting video:', error);
    document.getElementById('error-message').textContent = error.message || 'An error occurred while exporting the video.';
  }
});

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
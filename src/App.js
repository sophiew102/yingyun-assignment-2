import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { KMeansInteractive } from './kmeansAlgo';

const App = () => {
  const [data, setData] = useState([]);
  const [centers, setCenters] = useState([]);  // This will now hold centroids as soon as they are selected
  const [clusters, setClusters] = useState(null); // Initialize clusters as null
  const [kmeans, setKMeans] = useState(null);
  const [k, setK] = useState(3);  // Initial number of clusters set to 3
  const [converged, setConverged] = useState(false);
  const [initMethod, setInitMethod] = useState('random');
  const [manualCenters, setManualCenters] = useState([]);
  const [currentDataset, setCurrentDataset] = useState([]);

  // Handle changes to the number of clusters
  const handleKChange = (event) => {
    const newK = parseInt(event.target.value);
    setK(newK);
    setManualCenters([]);  // Clear any previously set manual centers
    setCenters([]);        // Reset the centers
    setConverged(false);  // Reset convergence
  };

  // Handle clicks for manual centroid selection
  const handleManualCentroidClick = (event) => {
    if (initMethod === 'manual' && manualCenters.length < k) {
      const { x, y } = event.points[0]; // Get coordinates where the user clicked
      const newCentroid = [x, y];
      setManualCenters([...manualCenters, newCentroid]); // Add the clicked point to manualCenters
      setCenters([...centers, newCentroid]); // Immediately update the centers state to display red X

      if (manualCenters.length + 1 === k) {
        // If k centroids are selected, initialize the KMeans algorithm with these centroids
        const generatedKMeans = new KMeansInteractive(currentDataset, k, initMethod, [...manualCenters, newCentroid]);
        setKMeans(generatedKMeans);
        //alert("You have selected all centroids. You can now step through KMeans or run to convergence.");
      }
    }
  };

  // Generate random data points for demonstration
  const generateRandomData = (numPoints, numDims) => {
    return Array.from({ length: numPoints }, () => 
      Array.from({ length: numDims }, () => Math.random() * 10 - 5)
    );
  };

  // Function to handle dataset regeneration when the user clicks "Generate New Dataset"
  const handleGenerateNewDataset = () => {
    const generatedData = generateRandomData(300, 2);
    setData(generatedData);
    setCurrentDataset(generatedData);  // Save the new dataset in the state
    setKMeans(new KMeansInteractive(generatedData, k, initMethod, manualCenters));
    setConverged(false); // Reset convergence status
    setClusters(null); // Reset clusters to null (no color)
    setManualCenters([]); // Reset manual centers
    setCenters([]); // Reset centers
  };

  // UseEffect to initialize KMeans without regenerating the dataset
  useEffect(() => {
    if (currentDataset.length > 0) {
      setKMeans(new KMeansInteractive(currentDataset, k, initMethod, manualCenters));
    } else {
      handleGenerateNewDataset(); // Generate the dataset for the first time
    }
  }, [k, initMethod, manualCenters]);

  const handleStepThrough = () => {
    if (kmeans && !converged) {
      const result = kmeans.step();
      setCenters(result.centers);  // Update the centers dynamically, including manual ones
      setClusters(result.clusters); // Update clusters with the assignment
      setConverged(result.converged);
      if (result.converged) {
        alert("KMeans has converged.");
      }
    }
  };

  const handleRunToConvergence = () => {
    if (kmeans && !converged) {
      let result;
      while (!converged) {
        result = kmeans.step();
        setCenters(result.centers);  // Update the centers dynamically, including manual ones
        setClusters(result.clusters); // Update clusters with the assignment
        setConverged(result.converged);
        if (result.converged) {
          break;
        }
      }

      // Use setTimeout to ensure the UI renders before showing the alert
      setTimeout(() => {
        alert("KMeans has converged.");
      }, 0);
    }
  };

  // Function to reset the algorithm state
  const handleResetAlgorithm = () => {
    setKMeans(null);  // Clear the KMeans object
    setCenters([]);    // Reset centroids
    setClusters(null); // Reset clusters
    setManualCenters([]);  // Clear any manual selections
    setConverged(false);   // Reset convergence status
  };

  // Function to plot the data points based on cluster assignment
  const plotData = () => {
    let traces = [];
    
    if (clusters === null) {
      // Plot the data points without color (no clusters yet)
      traces.push({
        x: data.map(point => point[0]),
        y: data.map(point => point[1]),
        type: 'scatter',
        mode: 'markers',
        marker: { color: 'gray', size: 8 },
        name: 'Unassigned Data',
        showlegend: false
      });
    } else {
      // Create a trace for each cluster
      for (let i = 0; i < k; i++) {
        const clusterPoints = data
          .filter((_, index) => clusters[index] === i)
          .map((point) => ({
            x: point[0],
            y: point[1],
          }));

        const trace = {
          x: clusterPoints.map(point => point.x),
          y: clusterPoints.map(point => point.y),
          type: 'scatter',
          mode: 'markers',
          marker: { color: i, size: 8 },
          name: `Cluster ${i + 1}`,
          showlegend: false
        };

        traces.push(trace);
      }
    }

    return traces;
  };

  // Function to plot the centroids (including manual centroids)
  const plotCenters = () => {
    return centers.map((center, index) => ({
      x: [center[0]],
      y: [center[1]],
      type: 'scatter',
      mode: 'markers',
      marker: { color: 'red', size: 15, symbol: 'x' },
      name: `Centroid ${index + 1}`,
      showlegend: false
    }));
  };

  return (
    <div>
      <h2>KMeans Clustering Algorithm</h2>

      {/* Input for Number of Clusters */}
      <div>
        <label>Number of Clusters (k): </label>
        <input 
          type="number" 
          value={k} 
          min={1} 
          onChange={handleKChange} 
          style={{ width: '50px' }}
        />
      </div>

      <div>
        <label>Initialization Method: </label>
        <select value={initMethod} onChange={(e) => setInitMethod(e.target.value)}>
          <option value="random">Random</option>
          <option value="farthestFirst">Farthest First</option>
          <option value="kmeans++">KMeans++</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <button onClick={handleStepThrough} disabled={initMethod === 'manual' && manualCenters.length < k}>Step Through KMeans</button>
      <button onClick={handleRunToConvergence} disabled={initMethod === 'manual' && manualCenters.length < k}>Run to Convergence</button>
      <button onClick={handleGenerateNewDataset}>Generate New Dataset</button>
      <button onClick={handleResetAlgorithm}>Reset Algorithm</button>

      <Plot
        data={[...plotData(), ...plotCenters()]} // Only plot actual centers including manual ones
        layout={{ width: 700, height: 600, title: 'KMeans Clustering Animation' }}
        onClick={handleManualCentroidClick}
      />
    </div>
  );
};

export default App;


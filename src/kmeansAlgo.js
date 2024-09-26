export class KMeansInteractive {
  constructor(data, k, initMethod = 'random', manualCenters = []) {
    this.data = data;
    this.k = k;
    this.assignment = new Array(data.length).fill(-1);
    this.initMethod = initMethod;   // Initialization method passed in
    this.manualCenters = manualCenters;  // Manual centers passed in for 'manual' initialization
    this.centers = this.initializeCenters();  // Initialize centers based on the method
    this.previousCenters = this.centers.slice();
    this.currentIteration = 0;
    this.converged = false;
  }

  initializeCenters() {
    if (this.initMethod === 'random') {
      return this.initializeRandom();
    } else if (this.initMethod === 'farthestFirst') {
      return this.initializeFarthestFirst();
    } else if (this.initMethod === 'kmeans++') {
      return this.initializeKMeansPlusPlus();
    } else if (this.initMethod === 'manual') {
      return this.initializeManual(this.manualCenters);
    }
  }

  // Random initialization of centers
  initializeRandom() {
    let indices = [];
    while (indices.length < this.k) {
      let randomIndex = Math.floor(Math.random() * this.data.length);
      if (!indices.includes(randomIndex)) indices.push(randomIndex);
    }
    return indices.map(i => this.data[i]);
  }

  initializeFarthestFirst() {
    const firstCenter = this.data[Math.floor(Math.random() * this.data.length)];
    const centers = [firstCenter];
  
    while (centers.length < this.k) {
      let maxDistance = -1;
      let farthestPoint = null;
  
      this.data.forEach(point => {
        const minDistToCenters = centers.reduce((minDist, center) => {
          const dist = this.dist(center, point);
          return Math.min(minDist, dist);
        }, Infinity);
  
        if (minDistToCenters > maxDistance) {
          maxDistance = minDistToCenters;
          farthestPoint = point;
        }
      });
  
      centers.push(farthestPoint);
    }
  
    return centers;
  }
  
  initializeKMeansPlusPlus() {
    const centers = [this.data[Math.floor(Math.random() * this.data.length)]];
  
    while (centers.length < this.k) {
      const distances = this.data.map(point => {
        const minDistToCenters = centers.reduce((minDist, center) => {
          const dist = this.dist(center, point);
          return Math.min(minDist, dist);
        }, Infinity);
        return minDistToCenters ** 2;
      });
  
      const sumDistances = distances.reduce((a, b) => a + b, 0);
      const cumulativeProbs = distances.map((dist, i) => distances.slice(0, i + 1).reduce((a, b) => a + b, 0) / sumDistances);
  
      const randomValue = Math.random();
      const nextCenterIndex = cumulativeProbs.findIndex(prob => prob >= randomValue);
      centers.push(this.data[nextCenterIndex]);
    }
  
    return centers;
  }
  
  initializeManual(selectedPoints) {
    // `selectedPoints` should be an array of manually clicked coordinates
    return selectedPoints.slice(0, this.k);  // Limit to k points
  }
  

  // Assign points to the closest center
  makeClusters() {
    for (let i = 0; i < this.assignment.length; i++) {
      let dist = this.dist(this.centers[0], this.data[i]);
      let clusterIndex = 0;
      for (let j = 1; j < this.k; j++) {
        let newDist = this.dist(this.centers[j], this.data[i]);
        if (newDist < dist) {
          dist = newDist;
          clusterIndex = j;
        }
      }
      this.assignment[i] = clusterIndex;
    }
  }

  // Compute new centers
  computeCenters() {
    let newCenters = Array(this.k).fill(null).map(() => Array(this.data[0].length).fill(0));
    let counts = Array(this.k).fill(0);

    this.assignment.forEach((cluster, i) => {
      counts[cluster] += 1;
      for (let j = 0; j < this.data[i].length; j++) {
        newCenters[cluster][j] += this.data[i][j];
      }
    });

    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < newCenters[i].length; j++) {
        newCenters[i][j] /= counts[i];
      }
    }

    this.previousCenters = this.centers.slice();
    this.centers = newCenters;
  }

  // Check if centers have converged
  areCentersConverged() {
    for (let i = 0; i < this.k; i++) {
      if (this.dist(this.centers[i], this.previousCenters[i]) > 1e-5) {
        return false;
      }
    }
    return true;
  }

  // Calculate Euclidean distance
  dist(x, y) {
    return Math.sqrt(x.reduce((sum, val, i) => sum + (val - y[i]) ** 2, 0));
  }

  // Perform one step of the KMeans Algorithm
  step() {
    if (this.converged) {
      return { centers: this.centers, clusters: this.assignment, converged: true };
    }

    // Assign clusters to data points
    this.makeClusters();
    this.computeCenters();

    // Check if the centers have converged
    if (this.areCentersConverged()) {
      this.converged = true;
      return { centers: this.centers, clusters: this.assignment, converged: true };
    }

    return { centers: this.centers, clusters: this.assignment, converged: false };
  }
}

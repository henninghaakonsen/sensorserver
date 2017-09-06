import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {data: []}

  componentDidMount() {
    fetch('/api/data')
      .then(console.log(res => res.json()))
      .then(res => res.json())
      .then(data => this.setState({ data }));
  }


  render() {
    console.log(this.state.data)

    return (
      <div className="App">
        <h1>DATA</h1>
        {this.state.data.map(data =>
          <div key={data.test}>{data.test}</div>
        )}
      </div>
    );
  }
}

export default App;

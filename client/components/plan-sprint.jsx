import React from 'react';
import { withRouter } from 'react-router';
import { withTracker } from 'meteor/react-meteor-data';
import { Tasks, Iterations } from '../../imports/collections.js';
import { types, statuses, priorities } from '../../imports/constants.js';
import Task from './task';
import Dropdown from './dropdown';

class PlanSprintBoard extends React.Component{
  constructor(props){
    super(props);
    this.state = { backlogCheckedTasks: [], sprintCheckedTasks: [], sprint: props.iteration };
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onTaskCheck = this.onTaskCheck.bind(this);
    this.moveToSprint = this.moveToSprint.bind(this);
    this.moveToBacklog = this.moveToBacklog.bind(this);
  }
  onDragOver(e){
    e.preventDefault();
  }
  onDrop(e, iteration){
    e.preventDefault();
    const stringified = e.dataTransfer.getData("text");
    if (!stringified) return;

    const data = JSON.parse(stringified);
    Meteor.call('updateTasksIteration', [data.taskId], iteration, (e, res)=>{
      if(e) console.log(e);
    })

    e.dataTransfer.clearData();
  }
  onTaskCheck(taskId, isChecked, iteration){
    let isBacklog = iteration == 'future iterations';
    let checked = isBacklog? this.state.backlogCheckedTasks.slice() : this.state.sprintCheckedTasks.slice();
    if(isChecked) checked.push(taskId);
    else {
      let ind = checked.indexOf(taskId);
      checked.splice(ind, 1);
    }
    if(isBacklog) this.setState({ backlogCheckedTasks: checked });
    else this.setState({ sprintCheckedTasks: checked });
  }
  changeSprint(offset){
    let current = this.state.sprint;
    let ind = Iterations.indexOf(current);
    let newSprint = Iterations[ind+offset];
    if(newSprint && newSprint !='future iterations'){
      this.setState({ sprint: newSprint });
    }
  }
  moveToSprint(){
    let { sprint } = this.state;
    let scope = this;
    Meteor.call('updateTasksIteration', this.state.backlogCheckedTasks, sprint, (e,res)=>{
      if(e) console.log(e);
      scope.setState({backlogCheckedTasks:[]});
    });
  }
  moveToBacklog(){
    let backlog = 'future iterations';
    scope = this;
    Meteor.call('updateTasksIteration', this.state.sprintCheckedTasks, backlog, (e,res)=>{
      if(e) console.log(e);
      scope.setState({sprintCheckedTasks: []});
    });
  }
  renderBox(title, styleClass, iteration, tasksList){
    return <div className={styleClass} onDragOver={this.onDragOver} onDrop={(e)=> this.onDrop(e, iteration)}>
              <h3>{title}</h3>
              { tasksList.map(el=>
                <Task task={el} key={el._id} onEdit={ this.props.onEditTask}
                  allowDrag={true} onTaskCheck={(taskId, isChecked)=>this.onTaskCheck(taskId, isChecked, iteration)}/>) }
           </div>
  }
  render(){
    let { tasks } = this.props;
    let { sprint } = this.state;
    let backLog = tasks.filter(el=> el.iteration != sprint);
    let currentTasks = tasks.filter(el=> el.iteration == sprint);

    return <div className='plan-sprint'>
      <h2>Planning Tasks for
        <i className="fa fa-angle-left" onClick={()=> this.changeSprint(-1)}/>
        {sprint}
        <i className="fa fa-angle-right" onClick={()=> this.changeSprint(+1)}/>
      </h2>
      <div className='plan-sprint-board' >
        { this.renderBox('Backlog', 'todo box', 'future iterations', backLog)}
        <div className='buttons'>
          <button onClick={ this.moveToSprint }> -&gt; </button>
          <button onClick={ this.moveToBacklog }> &lt;- </button>
        </div>
        { this.renderBox(sprint, 'in-progress box', sprint, currentTasks)}
      </div>
    </div>
  }
}

export default withTracker(props=>{
  let tasks = Tasks.find({ status: statuses.OPEN }).fetch() || [];
  return { tasks };
})(PlanSprintBoard)

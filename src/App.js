import React, {Component} from 'react';
import {Route, withRouter} from 'react-router-dom';

//Import Components.
import Post from './components/endpoints/Post';
import Notification from './components/endpoints/Notification';
import Badge from './components/endpoints/Badge';
import BadgeContainer from './components/layout/Badge-container';
import SearchBody from './components/layout/Search-container';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Loader from './components/layout/Loader';
import Modal from './components/layout/Modal';
import Searchbar from './components/Searchbar';
//Import CSS.
import './App.css';
//Import Helpers.
import checkIfValid from './helper/regexCheck.js';
import checkSubExist from './helper/checkSubExist.js';
import getFilteredList from './helper/getFilteredList';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      darkMode: true,
      postsLoading: false,
      modalImg: undefined,
      notification: {
          type: "",
          message: ""
        },
      postsGot: [],
      after : "",
      subRedditList: [],
      loading: false,
    }
    this.searchInputHandler = this.searchInputHandler.bind(this);
    this.getPosts = this.getPosts.bind(this);
    this.messageDisplay = this.messageDisplay.bind(this);
    this.resetMessage = this.resetMessage.bind(this);
    this.deleteSubFromList = this.deleteSubFromList.bind(this);
    this.modalHandler = this.modalHandler.bind(this);
    this.loadMorePosts = this.loadMorePosts.bind(this);
    this.darkModeToggle = this.darkModeToggle.bind(this);
  }

  componentDidUpdate(prevProps, prevState){
    // Detecting change in pathname.
    // Change in pathname => subredditlist update and get posts.
    if(prevProps.location.pathname !== this.props.location.pathname){
        if(this.props.location.pathname.substr(1).length !== 0){
          this.setState({
            subRedditList : this.props.location.pathname.substr(1).split("+")
          }, ()=>{
            this.getPosts(`r/${this.props.location.pathname.substr(1)}`);
          })
        } else {
          this.setState({subRedditList : []})
        }
      }
    //Changes in subreddit list will trigger a list updated.
    if(prevState.subRedditList.join("") !== this.state.subRedditList.join("")){
      localStorage.setItem("subRedditList", JSON.stringify(this.state.subRedditList));
    }
  }

  componentDidMount(){
    const existingList = JSON.parse(localStorage.getItem("subRedditList"));
    const darkMode = JSON.parse(localStorage.getItem("darkMode"));

    //Call on mount - predefined url.
    if(this.props.location.pathname.substr(1) !== ""){
      this.setState({subRedditList : this.props.location.pathname.substr(1).split("+")});
      this.getPosts(`r/${this.props.location.pathname.substr(1)}`);
    } else if(existingList !== null){
      //Reload previously visited sub.
      if(existingList.length !== 0){
        this.props.history.push(existingList.join("+"));
        this.messageDisplay("Reloaded previously visited list", "info");
      }
    }

    //Initiating mode previously used.
    if(darkMode !== null){
      this.setState({
        darkMode: darkMode
      },
      ()=>{
        //Setting BG of body as per view-mode
          if(darkMode){
            document.getElementsByTagName("BODY")[0].style.background = "#151419";
          } else {
            document.getElementsByTagName("BODY")[0].style.background = "white";
          }
        }
      )
    }

  }

  searchInputHandler(searchInput){
    //Takes input from search component then passes it onto the helper functions.
    //The functions check for validity.
    //If valid will cause an update in URL which translates ta new call.
    let input = searchInput.toLowerCase();
    let newHistory = [].concat(this.state.subRedditList);
    if(!newHistory.includes(input)){
      checkIfValid(input).then(()=>{return checkSubExist(input)})
        .then((res)=>{
          //Successful. Will trigger a URL change.
          newHistory.push(input);
          this.setState({
            subRedditList : newHistory,
            error : ""
          }, ()=>{this.props.history.push(newHistory.join("+"))});
        })
        .catch(err=>{
          this.messageDisplay(err, "error");
        })
    }
  }

  getPosts(page){
    this.setState({loading: true});
    // Retrieving posts for page to be displayed
    let [type, sub] = page.split("/");
    getFilteredList(sub, type, "media").then(result=>{
      this.setState({postsGot : result.posts,
                     after: result.after
                    });
    })
    .then(()=>{
      this.setState({loading : false});
    })
    .catch(err=>{
      //Unsuccessful. Will trigger error catcher.
      this.messageDisplay(err, "error");
    })
  }

  messageDisplay(message, type){
    this.setState({
      postsLoading: false,
      loading: false,
      messagePending: true,
      notification : {
        message: message,
        type: type
      }
    }, ()=>{
  // Resetting the error.
    setTimeout(this.resetMessage, 3000);
  })
  };

  resetMessage(){
    this.setState({
      messagePending: false,
      notification : {
        message: "",
        type: ""
      }
    })
  }

  deleteSubFromList(subToDelete){
    let currentSub = [].concat(this.state.subRedditList);
    let newSubs = currentSub.filter((sub)=>{return subToDelete !== sub});
    this.setState({subRedditList: newSubs},
        ()=>{this.props.history.push(newSubs.join("+"))}
    );
  }

  modalHandler(img = undefined){
    if(img === undefined){
      this.setState({modalImg : undefined})
    } else {
      this.setState({modalImg : img})
    }
  }

  loadMorePosts(){
    this.setState({postsLoading: true},
      ()=>{
        getFilteredList(this.state.subRedditList.join("+"), "r", "media", this.state.after)
          .then(result=>{
            this.setState({
                           postsGot : this.state.postsGot.concat(result.posts),
                           after : result.after,
                           postsLoading: false
                          })
          })
        .catch((err)=>{
          this.messageDisplay(err, "error");
        });
      }
    )
  }

  darkModeToggle(){
    this.setState({darkMode: !this.state.darkMode},
      ()=>{
        localStorage.setItem("darkMode", this.state.darkMode);
      }
      );
  }


  render(){
    return (
      <div className={this.state.darkMode ? "bg-darkmode-black" : "bg-lightgrey"}>
      {this.state.messagePending ? <Notification message={this.state.notification["message"]} type={this.state.notification["type"]}/> : null}
      {this.state.modalImg !== undefined ? <Modal modalToggleHandler={this.modalHandler} modalImg={this.state.modalImg}/> : null}

        <Header copyHandler={this.messageDisplay} darkMode={this.state.darkMode} darkModeToggle={this.darkModeToggle}>
          <Searchbar subSubmitHandler={this.searchInputHandler}/>
        </Header>

        <Route path="/:subreddits" render={() =>
              <React.Fragment>
                <BadgeContainer darkMode={this.state.darkMode}>
                  {this.state.subRedditList.map(sub=><Badge sub={sub} key={sub} deleteSubHandler={this.deleteSubFromList}/>)}
                </BadgeContainer>

                {this.state.loading !== false ?
                  <Loader/>:
                  undefined
                }


                <SearchBody loadHandler={this.loadMorePosts} postsLoading={this.state.postsLoading}>
                {this.state.postsGot.map((post)=>
                  <Post
                   darkMode={this.state.darkMode}
                   key={post.title}
                   imgSrc={post.picture}
                   title={post.title}
                   author={post.author}
                   upVotes={post.upvotes}
                   comments={post.comments}
                   link={post.link}
                   embed={post["gfycatHostedVideo"]}
                   redVid={post["redditHostedVideo"]}
                   time={post["timeSinceUpload"]}
                   copyHandler={this.messageDisplay}
                   modalHandler={this.modalHandler}
                  />
                )}
                </SearchBody>
                {this.state.postsLoading !== false ?
                  <Loader/>:
                  undefined
                }
              </React.Fragment>

            }>
        </Route>
        <Footer/>
      </div>
    )
  }
}

export default withRouter(App);

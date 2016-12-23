import { TagCloudModule } from 'angular-tag-cloud-module';
import { element } from 'protractor';
import { DataService } from './../../shared/dataService/data-service.service';
import { Http } from '@angular/http';
import { ConvertService } from './../../shared/convertService/convert.service';
import { Component, OnInit } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import { Discourselink } from './../../../assets/discourselink';
@Component({
    selector: 'app-tracks',
    templateUrl: './tracks.component.html',
    styleUrls: ['./tracks.component.scss']
})
export class TracksComponent implements OnInit {

    posts = [];
    counts = {};
    tags = [];
    speeches = [];
    meetings = [];
    conferences = [];
    interviews = [];
    others = [];
    total = [];


    constructor(
        private dataService: DataService,
        private convertService: ConvertService,
        private http: Http)
    { }

    private getCategory() {
        return this.http.get(Discourselink.Host + Discourselink.Text + Discourselink.tmp + "/306.json?include_raw=1")
            .map(function(data) {
                data = data.json();
                var rawString = data['post_stream']['posts'][0]['raw'];
                return rawString;
            })
    }

    private getIds() {
        return this.http.get(Discourselink.Host + Discourselink.Category + Discourselink.getId + Discourselink.Filename)
            .map(function(data) {
                data = data.json();
                var ids = [];
                var topics = data['topic_list']['topics'];
                topics.forEach(function(topic) {
                    ids.push(topic['id']);
                });
                return ids.slice(1);
            })
    }

    private getPost(id: string) {
        return this.http.get(Discourselink.Host + Discourselink.Text + id + ".json?include_raw=1")
            .map(function(data) {
                data = data.json();
                var detail = {};
                detail['title'] = data['title'];
                detail['date'] = data['created_at'];
                detail['content'] = data['post_stream']['posts'][0]['raw'];
                detail['tags'] = data['tags'];
                return detail;

            })
        // .do(data => console.log(data));
    }

    private distribute_post(category, post) {
post['category'] = 'Other';
        Object.keys(category).forEach(key => {
            for (var i = 0; i < category[key].length; i++) {
                if (post['title'].indexOf(category[key][i]) > -1) {
                    post['category'] = key;
                    return post;
                }
            }
        })

        
        return post;

    }


    ngOnInit() {

        this.http.get(Discourselink.Host + "tags/filter/search.json")
            .map(data => {
                data = data.json();
                var tags = [];
                var discourseTags: [Object] = data['results'];
                for (var i in discourseTags) {
                    var tag = {};
                    tag['text'] = discourseTags[i]['text'];
                    tag['weight'] = discourseTags[i]['count'];
                    tag['link'] = "http://localhost:4200/#/how-we-work/tracks?q=" + discourseTags[i]['text'];
                    tags.push(tag);
                }
                return tags;
            })
            // .do(data => { console.log(data); })
            .subscribe(
            tags => { this.tags = tags; }
            );

        this.getCategory().subscribe(category => {
            category = this.convertService.convertYAMLtoJSON(category)
            this.total.push({ category: 'All', posts: new Array<string>() });
            Object.keys(category).forEach(key => {
                this.total.push({ category: key, posts: new Array<string>() });
            })
            this.total.push({ category: 'Other', posts: new Array<string>() });

            this.getIds().subscribe(ids => {
                ids.forEach(id => {
                    this.getPost(id).subscribe(post => {

                        // console.log(post);

                        var content = this.convertService.convertYAMLtoJSON(post['content'])

                        // console.log(content['content']);
                        // console.log(post);
                        post['content'] = content['content']

                        post = this.distribute_post(category, post);
                        
                    console.log(post['title'] + "   " +post['category'])

                        this.total[0]['posts'].push(post);
                        this.total.forEach(object => {
                            if (object['category'] === post['category']) {
                                object['posts'].push(post);
                            }
                        })


                    })

                })

            })
            // console.log(this.total);
        });
    }

}

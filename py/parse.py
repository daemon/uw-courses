import json
import os
import re

def build_graph():
  departments = ['AMATH', 'CO', 'CS', 'MATH', 'PMATH', 'STAT']
  graph = {}
  for dept in departments:
    pattern = re.compile('<a name = "%s(\\d+)"></a>.+?</b></td><td.+?<b>(.+?)</B>.+?<td colspan=2>(.+?)</td>.+?(Prereq: (.+?)</i>)?(.+?Antireq: (.+?)</i>)?' % dept)
    with open('html/%s.html' % dept) as f:
      content = f.read().split('<table border=0 width=80%><tr><td align=left>')
    for course in content:
      m = re.search(pattern, course.replace('\n', ''))
      if not m:
        continue
      no = m.group(1)
      graph["%s%s" % (dept, no)] = {"title": m.group(2), "description": m.group(3)}
  offered_pattern = re.compile('\\[(Note: .+?)?Offered: (.+?)\\]')
  for course in graph:
    info = graph[course]
    m = re.search(offered_pattern, info["description"])
    if not m:
      print('Manually lookup %s' % course)
      continue
    info["description"] = re.sub(offered_pattern, '', info["description"])
    info["offered"] = m.group(2).split(',')
  return graph

def edit_course(graph):
  course_name = raw_input('Course name: ')
  try:
    course = graph[course_name]
  except KeyError:
    print('Course doesn\'t exist!')
    return
  try:
    offer_terms = ', '.join(course["offered"])
  except KeyError:
    offer_terms = ''
  offer_terms = raw_input('Offer terms (%s): ' % offer_terms).split(',')
  if offer_terms[0]:
    course['offered'] = offer_terms
  prereqs = raw_input('Prereqs: ')
  groups = prereqs.replace(' ', '').split(',')
  prereqs = []
  for group in groups:
    prereqs.append(group.split('|'))
  if prereqs[0][0]:
    print('Modified prereqs!')
    course['prereqs'] = prereqs
  antireqs = raw_input('Antireqs: ').replace(' ', '').split(',')
  if antireqs[0]:
    print('Modified antireqs!')
    course['antireqs'] = antireqs
  print('Done editing!')        

def load_graph():
  with open('graph.json') as f:
    return json.loads(f.read())

def save_graph(graph):
  with open('graph.json', 'w') as f:
    f.write(json.dumps(graph))

def print_menu():
  def print_line(key, usage):
    print('%2s - %s' % (key, usage))
  print_line('e', 'Edit courses')
  print_line('l', 'Load from save')
  print_line('n', 'New course graph from files')
  print_line('s', 'Save graph')

def main():
  graph = None
  while True:
    print_menu()
    key = raw_input(':')
    if key == 'e':
      if not graph:
        print('Need to load graph first.')
      edit_course(graph)
    elif key == 'n':
      print('Constructing graph...')
      graph = build_graph()
      print('Graph constructed!')
    elif key == 'l':
      print('Loading graph...')
      graph = load_graph()
      print('Graph loaded!')
    elif key == 's':
      print('Saving graph...')
      save_graph(graph)
      print('Graph saved!')
main()

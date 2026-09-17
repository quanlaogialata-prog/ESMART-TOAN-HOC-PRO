import fs from 'fs';

let content = fs.readFileSync('src/pages/teacher/Gradebook.tsx', 'utf8');

// The issue was earlier in the file where we replaced:
// </table>
//      </div>
// with 
// </table>
//        </div>
//      </div>

// But wait, the grep shows:
// 408:        </table>
// 409-      </div>
// 
// So our manual replacement from earlier didn't actually add the extra </div> because of the literal \n.
// So now there's an UNCLOSED <div className="overflow-x-auto w-full"> from our first regex replace!

// Let's close it correctly.
content = content.replace(
  '        </table>\\n      </div>',
  '        </table>\\n        </div>\\n      </div>'
);
content = content.replace(
  '        </table>\n      </div>',
  '        </table>\n        </div>\n      </div>'
);

fs.writeFileSync('src/pages/teacher/Gradebook.tsx', content);

let content2 = fs.readFileSync('src/pages/teacher/ManageSubmissions.tsx', 'utf8');
content2 = content2.replace(
  '        </table>\n      </div>',
  '        </table>\n        </div>\n      </div>'
);
content2 = content2.replace(
  '        </table>\\n      </div>',
  '        </table>\\n        </div>\\n      </div>'
);
fs.writeFileSync('src/pages/teacher/ManageSubmissions.tsx', content2);

let content3 = fs.readFileSync('src/pages/teacher/ManageTests.tsx', 'utf8');
content3 = content3.replace(
  '        </table>\n      </div>',
  '        </table>\n        </div>\n      </div>'
);
content3 = content3.replace(
  '        </table>\\n      </div>',
  '        </table>\\n        </div>\\n      </div>'
);
fs.writeFileSync('src/pages/teacher/ManageTests.tsx', content3);

console.log("Fixed JSX syntax properly!");
